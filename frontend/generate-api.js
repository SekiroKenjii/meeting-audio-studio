/**
 * API Proxy Generator for Meeting Audio Studio Frontend
 * Reads backend API documentation and generates/updates the API service
 */

import fs from "fs";
import https from "https";
import http from "http";
import process from "process";

// Configuration
const API_BASE_URL = process.env.VITE_API_URL || "http://localhost:8000/api";
const API_VERSION = process.env.VITE_API_VERSION || "v1";
const DOCS_ENDPOINT = `${API_BASE_URL}/docs`;
const OUTPUT_FILE = "src/services/apiService.ts";

console.log("Generating API Proxy from Backend Documentation...");
console.log(`Fetching API documentation from: ${DOCS_ENDPOINT}`);
console.log(`Using API Version: ${API_VERSION}`);

// Fetch API documentation
function fetchApiDocs() {
  return new Promise((resolve, reject) => {
    const isHttps = DOCS_ENDPOINT.startsWith("https");
    const client = isHttps ? https : http;

    client
      .get(DOCS_ENDPOINT, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const apiDocs = JSON.parse(data);
            resolve(apiDocs);
          } catch (parseError) {
            reject(new Error(`Invalid JSON response: ${parseError.message}`));
          }
        });
      })
      .on("error", reject);
  });
}

// Generate method from auto-discovered route
function generateMethodFromDiscoveredRoute(route) {
  const { method: httpMethod, uri, name: routeName } = route;

  const methodName = extractMethodName(routeName, httpMethod, uri);
  const apiPath = uri.replace("/api/v1", ""); // Remove API version prefix

  // Extract resource name and convert to expected format
  const resource = routeName?.split(".")[1]?.replace("-", "_") || "resource";
  const actionKey = routeName?.split(".").pop() || "request";

  const implementationDetails = generateMethodImplementation(
    actionKey,
    httpMethod.toUpperCase(),
    apiPath,
    resource
  );

  const description = generateMethodDescription(actionKey, resource);

  const { params, returnType } = determineMethodSignature(uri, httpMethod);

  return {
    name: methodName,
    params: implementationDetails.params?.join(", ") || params,
    returnType: implementationDetails.returnType || returnType,
    description,
    implementation: implementationDetails.body,
  };
}

// Extract method name from route information
function extractMethodName(routeName, httpMethod, uri) {
  if (routeName) {
    const parts = routeName.split(".");
    if (parts.length >= 3) {
      const resource = parts[1].replace("-", "_");
      const action = parts[parts.length - 1];
      return generateMethodName(action, resource);
    }
  }

  // Fallback: generate from URI pattern
  const pathSegments = uri
    .split("/")
    .filter((segment) => segment && !segment.startsWith("{"));
  const resource = pathSegments[pathSegments.length - 1] || "resource";

  let action;
  if (httpMethod.toLowerCase() === "get" && uri.includes("{id}")) {
    action = "show";
  } else if (httpMethod.toLowerCase() === "post") {
    action = "store";
  } else {
    action = "index";
  }

  return generateMethodName(action, resource);
}

// Determine method signature (parameters and return type)
function determineMethodSignature(uri, httpMethod) {
  const hasIdParam = uri.includes("{id}");
  const hasFileParam = uri.includes("{filename}");
  const isPost = httpMethod.toLowerCase() === "post";

  let params = "";
  if (hasIdParam) params += "id: string";
  if (hasFileParam) {
    if (params) params += ", ";
    params += "filename: string";
  }
  if (isPost) {
    if (params) params += ", ";
    params += "data?: any";
  }

  return {
    params,
    returnType: "Promise<ApiResponse<any>>",
  };
}

// Generate method name based on key and resource (legacy support)
function generateMethodName(key, resource) {
  const resourceSingular = singularize(resource);
  const resourceCapitalized = capitalize(resourceSingular);
  const resourcePlural = capitalize(resource.replace(/_/g, ""));

  const methodMap = {
    list: resource === "audio_files" ? "getAudioFiles" : `get${resourcePlural}`,
    create: `create${resourceCapitalized}`,
    store:
      resource === "audio_files"
        ? "uploadAudio"
        : `create${resourceCapitalized}`,
    show: `get${resourceCapitalized}`,
    download: `download${resourceCapitalized}`,
    stream: `stream${resourceCapitalized}`,
    config: "getUploadConfig",
    backups: "getBackupFiles",
    backup_download: "downloadBackupFile",
    backup_stream: "streamBackupFile",
    transcript: "getTranscriptByAudioFile",
    query: "queryTranscript",
    "queries.store": "queryTranscript",
  };

  return methodMap[key] || key.replace(/[._]/g, "");
}

// Generate method implementation
function generateMethodImplementation(key, httpMethod, apiPath, resource) {
  const requestContext = analyzeRequest(key, httpMethod, apiPath, resource);

  if (requestContext.isUpload) {
    return createUploadImplementation(apiPath);
  }

  if (requestContext.isQuery) {
    return createQueryImplementation(apiPath, requestContext.hasIdParam);
  }

  if (requestContext.isDownloadOrStream) {
    return createDownloadImplementation(
      apiPath,
      requestContext.hasIdParam,
      requestContext.hasFilenameParam
    );
  }

  if (httpMethod === "GET") {
    return createGetImplementation(
      key,
      apiPath,
      resource,
      requestContext.hasIdParam
    );
  }

  return createGenericImplementation(apiPath, httpMethod);
}

// Analyze request characteristics
function analyzeRequest(key, httpMethod, apiPath, resource) {
  const method = httpMethod.toUpperCase();
  return {
    hasIdParam: apiPath.includes("/{id}"),
    hasFilenameParam: apiPath.includes("/{filename}"),
    isUpload:
      method === "POST" &&
      resource === "audio_files" &&
      !apiPath.includes("/queries"),
    isQuery: method === "POST" && apiPath.includes("/queries"),
    isDownloadOrStream:
      method === "GET" && (key.includes("download") || key.includes("stream")),
  };
}

// Create upload implementation
function createUploadImplementation(apiPath) {
  return {
    params: ["file: File"],
    returnType: "Promise<ApiResponse<any>>",
    body: `
    const formData = new FormData();
    formData.append("audio_file", file);

    return this.request("${apiPath}", {
      method: "POST",
      body: formData,
    });`,
  };
}

// Create query implementation
function createQueryImplementation(apiPath, hasIdParam) {
  const params = hasIdParam
    ? ["id: number", "query: string"]
    : ["query: string"];
  const urlPath = apiPath.replace("/{id}", "/${id}");

  return {
    params,
    returnType: "Promise<ApiResponse<any>>",
    body: `
    return this.request(\`${urlPath}\`, {
      method: "POST",
      body: { query },
    });`,
  };
}

// Create download/stream implementation
function createDownloadImplementation(apiPath, hasIdParam, hasFilenameParam) {
  const params = [];
  if (hasIdParam) params.push("id: number");
  if (hasFilenameParam) params.push("filename: string");

  const urlPath = apiPath
    .replace("/{id}", "/${id}")
    .replace("/{filename}", "/${encodeURIComponent(filename)}");

  return {
    params,
    returnType: "Promise<Response>",
    body: `
    const url = \`${urlPath}\`;
    return fetch(url);`,
  };
}

// Create GET implementation
function createGetImplementation(key, apiPath, resource, hasIdParam) {
  const params = hasIdParam ? ["id: number"] : [];
  const returnType =
    key === "list" && resource === "audio_files"
      ? "Promise<ApiResponse<any[]>>"
      : "Promise<ApiResponse<any>>";
  const urlPath = apiPath.replace("/{id}", "/${id}");

  return {
    params,
    returnType,
    body: `
    return this.request(\`${urlPath}\`);`,
  };
}

// Create generic implementation
function createGenericImplementation(apiPath, httpMethod) {
  const isGetMethod = httpMethod.toUpperCase() === "GET";

  return {
    params: isGetMethod ? [] : ["options: any = {}"],
    returnType: "Promise<ApiResponse<any>>",
    body: isGetMethod
      ? `
    return this.request("${apiPath}");`
      : `
    return this.request("${apiPath}", {
      method: "${httpMethod}",
      body: options,
    });`,
  };
}

// Generate method from endpoint definition
function generateMethodFromEndpoint(key, endpoint, resource) {
  if (typeof endpoint !== "string") return null;

  const [httpMethod, path] = endpoint.split(" ");
  // Remove the /api/v1 prefix to get clean endpoint path
  const apiPath = path.replace("/api/v1", "");

  const methodName = generateMethodName(key, resource);
  const implementation = generateMethodImplementation(
    key,
    httpMethod,
    apiPath,
    resource
  );

  return {
    name: methodName,
    params: implementation.params.join(", "),
    returnType: implementation.returnType,
    implementation: implementation.body,
    description: generateMethodDescription(key, resource),
  };
}

function generateMethodDescription(key, resource) {
  const resourceName = resource.replace("_", " ");
  const descriptions = {
    list: `Get all ${resourceName}`,
    create: `Create a new ${singularize(resourceName)}`,
    store: `Create a new ${singularize(resourceName)}`,
    show: `Get ${singularize(resourceName)} by ID`,
    download: `Download ${singularize(resourceName)} file`,
    stream: `Stream ${singularize(resourceName)} file`,
    config: "Get upload configuration",
    backups: "Get backup files list",
    backup_download: "Download backup file",
    backup_stream: "Stream backup file",
    transcript: "Get transcript for audio file",
    query: "Query transcript with AI",
  };

  return descriptions[key] || `${capitalize(key)} ${resourceName}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toCamelCase(str) {
  // Convert kebab-case to camelCase (e.g., 'audio-files' -> 'audioFiles')
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

function singularize(str) {
  // Handle underscored resource names like 'audio_files'
  if (str.includes("_")) {
    const parts = str.split("_");
    // Convert 'audio_files' to 'AudioFile'
    if (parts.length === 2 && parts[1] === "files") {
      return capitalize(parts[0]) + "File";
    }
    // For other cases, capitalize each part and join
    return parts.map((part) => capitalize(part)).join("");
  }

  // Handle regular plurals
  if (str.endsWith("files")) return capitalize(str.slice(0, -1));
  if (str.endsWith("s")) return capitalize(str.slice(0, -1));
  return capitalize(str);
}

// Generate the complete API service file structure (separated by resource)
function generateResourceServices(apiDocs) {
  const resources = apiDocs.endpoints?.v1?.resources || {};
  const discoveredRoutes = apiDocs.endpoints?.discovered_routes || [];

  console.log(`Found ${Object.keys(resources).length} resource groups`);
  console.log(`Processing ${discoveredRoutes.length} auto-discovered routes`);

  // Group discovered routes by resource
  const routesByResource = {};
  discoveredRoutes.forEach((route) => {
    const resourceMatch = route.uri.match(/^\/api\/v\d+\/([^/]+)/);
    if (resourceMatch) {
      const resource = resourceMatch[1];
      if (!routesByResource[resource]) {
        routesByResource[resource] = [];
      }
      routesByResource[resource].push(route);
    }
  });

  // Generate service files for each resource
  const serviceFiles = {};

  Object.keys(resources).forEach((resourceKey) => {
    const resource = resourceKey;
    const routes = routesByResource[resource] || [];
    const resourceEndpoints = resources[resourceKey] || {};

    console.log(`Generating service for resource: ${resource}`);

    const methods = [];

    // Process discovered routes for this resource
    routes.forEach((route) => {
      const method = generateMethodFromDiscoveredRoute(route);
      if (method) methods.push(method);
    });

    // Fallback to structured endpoints if no discovered routes
    if (methods.length === 0) {
      Object.entries(resourceEndpoints).forEach(([key, endpoint]) => {
        const method = generateMethodFromEndpoint(key, endpoint, resource);
        if (method) methods.push(method);
      });
    }

    // Remove duplicates
    const uniqueMethods = methods.filter(
      (method, index, self) =>
        index === self.findIndex((m) => m.name === method.name)
    );

    serviceFiles[resource] = generateResourceServiceFile(
      resource,
      uniqueMethods
    );
  });

  return serviceFiles;
}

// Generate individual resource service file
function generateResourceServiceFile(resource, methods) {
  const className = generateResourceClassName(resource);
  const serviceName = generateResourceServiceName(resource);

  const methodsSection = methods
    .map(
      (method) => `
  /**
   * ${method.description}
   */
  async ${method.name}(${method.params}): ${method.returnType} {${method.implementation}
  }`
    )
    .join("\n");

  return `// Auto-generated API service
// Generated on: ${new Date().toISOString()}

import { apiService } from "@/lib/services/apiService";
import { ApiResponse } from "@/lib/types/apiResponse";

/**
 * ${className} API Service
 * Auto-generated from backend API documentation
 */
class ${className} {
  private request<T>(
    endpoint: string,
    options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: any;
      showToast?: boolean;
    }
  ): Promise<ApiResponse<T>> {
    return apiService.request<T>(endpoint, options);
  }
${methodsSection}
}

export const ${serviceName} = new ${className}();
`;
}

// Generate resource class name
function generateResourceClassName(resource) {
  const name = resource
    .split("-")
    .map((part) => capitalize(part))
    .join("");
  return `${name}Service`;
}

// Generate resource service instance name
function generateResourceServiceName(resource) {
  const camelCaseName = toCamelCase(resource);
  return `${camelCaseName}Service`;
}

// Generate index file that exports all services
function generateIndexFile(resourceKeys) {
  const imports = resourceKeys
    .map((resource) => {
      const camelCaseResource = toCamelCase(resource);
      const serviceName = generateResourceServiceName(resource);
      return `import { ${serviceName} } from './${camelCaseResource}Service';`;
    })
    .join("\n");

  return `// Auto-generated API services index
// Generated on: ${new Date().toISOString()}

${imports}

// Convenient object for accessing all services
export const api = {
${resourceKeys
  .map((resource) => {
    const camelCaseProperty = toCamelCase(resource);
    const serviceName = generateResourceServiceName(resource);
    return `  ${camelCaseProperty}: ${serviceName},`;
  })
  .join("\n")}
};
`;
}

// Main execution
async function main() {
  try {
    const apiDocs = await fetchApiDocs();
    console.log("API documentation fetched successfully");

    // Generate resource-based service files
    const serviceFiles = generateResourceServices(apiDocs);
    const resourceKeys = Object.keys(serviceFiles);

    console.log(`Generated services for resources: ${resourceKeys.join(", ")}`);

    // Create services directory if it doesn't exist
    const servicesDir = "src/services";
    if (!fs.existsSync(servicesDir)) {
      fs.mkdirSync(servicesDir, { recursive: true });
    }

    // Write each resource service file
    for (const [resource, content] of Object.entries(serviceFiles)) {
      const camelCaseResource = toCamelCase(resource);
      const filename = `${servicesDir}/${camelCaseResource}Service.ts`;

      // Backup existing file if it exists
      if (fs.existsSync(filename)) {
        const backupFile = `${filename}.backup-${Date.now()}`;
        fs.copyFileSync(filename, backupFile);
        console.log(`Backed up existing ${filename} to: ${backupFile}`);
      }

      fs.writeFileSync(filename, content);
      console.log(`Generated: ${filename}`);
    }

    // Generate index file
    const indexContent = generateIndexFile(resourceKeys);
    const indexFile = `${servicesDir}/index.ts`;

    if (fs.existsSync(indexFile)) {
      const backupFile = `${indexFile}.backup-${Date.now()}`;
      fs.copyFileSync(indexFile, backupFile);
      console.log(`Backed up existing ${indexFile} to: ${backupFile}`);
    }

    fs.writeFileSync(indexFile, indexContent);
    console.log(`Generated: ${indexFile}`);

    // Count total generated methods
    const totalMethods = Object.values(serviceFiles)
      .map((content) => (content.match(/async \w+\(/g) || []).length)
      .reduce((sum, count) => sum + count, 0);

    console.log(
      `\nGenerated ${resourceKeys.length} service files with ${totalMethods} total API methods`
    );
    console.log("\nResource-based API generation completed!");

    console.log("\nTo use the new services:");
    console.log("  import { api } from '@/services';");
    console.log("  // or");
    console.log(
      "  import { audiofilesService, transcriptsService } from '@/services';"
    );
  } catch (error) {
    console.error("Error:", error.message);
    console.error("   Make sure the backend is running and accessible");
    process.exit(1);
  }
}

main();
