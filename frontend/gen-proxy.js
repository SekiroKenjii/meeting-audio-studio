/**
 * API Proxy Generator for Meeting Audio Studio Frontend
 * Reads backend API documentation and generates/updates the API service
 */

import fs from "fs";
import https from "https";
import http from "http";
import process from "process";

// ========================================================================================
// CONFIGURATION
// ========================================================================================

const CONFIG = {
  API_BASE_URL: process.env.VITE_API_URL || "http://localhost:8000/api",
  API_VERSION: process.env.VITE_API_VERSION || "v1",
  OUTPUT_DIR: "src/sdk/services",
  BACKUP_RETENTION: 24 * 60 * 60 * 1000, // 24 hours
};

const DOCS_ENDPOINT = `${CONFIG.API_BASE_URL}/docs`;

console.log("Generating API Proxy from Backend Documentation...");
console.log(`Fetching API documentation from: ${DOCS_ENDPOINT}`);
console.log(`Using API Version: ${CONFIG.API_VERSION}`);

// ========================================================================================
// UTILITY FUNCTIONS
// ========================================================================================

/**
 * String utility functions
 */
const StringUtils = {
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),

  toCamelCase: (str) =>
    str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase()),

  singularize: (str) => {
    if (str.includes("_")) {
      const parts = str.split("_");
      if (parts.length === 2 && parts[1] === "files") {
        return StringUtils.capitalize(parts[0]) + "File";
      }
      return parts.map((part) => StringUtils.capitalize(part)).join("");
    }

    if (str.endsWith("files")) return StringUtils.capitalize(str.slice(0, -1));
    if (str.endsWith("s")) return StringUtils.capitalize(str.slice(0, -1));
    return StringUtils.capitalize(str);
  },
};

/**
 * Route analysis utilities
 */
const RouteUtils = {
  extractResource: (uri) => {
    const resourceMatch = uri.match(/^\/api\/v\d+\/([^/]+)/);
    return resourceMatch ? resourceMatch[1] : "resource";
  },

  parseRouteName: (routeName) => {
    if (!routeName)
      return { resource: "resource", action: "request", isChunked: false };

    const parts = routeName.split(".");
    const resource = parts[1]?.replace("-", "_") || "resource";

    if (parts.length >= 4 && parts[2] === "chunked") {
      return { resource, action: `chunked.${parts[3]}`, isChunked: true };
    }

    return { resource, action: parts[parts.length - 1], isChunked: false };
  },

  cleanApiPath: (uri) => uri.replace("/api/v1", ""),

  hasParam: (path, param) => path.includes(`{${param}}`),

  replaceParam: (path, param) => path.replace(`{${param}}`, `\${${param}}`),
};

// ========================================================================================
// HTTP CLIENT
// ========================================================================================

/**
 * Fetch API documentation from backend
 */
async function fetchApiDocs() {
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

// ========================================================================================
// METHOD NAME MAPPING
// ========================================================================================

/**
 * Method name and description mappings
 */
const METHOD_MAPPINGS = {
  names: {
    list: (resource) =>
      resource === "audio_files"
        ? "getAudioFiles"
        : `get${StringUtils.capitalize(resource.replace(/_/g, ""))}`,
    create: (resource) => `create${StringUtils.singularize(resource)}`,
    store: (resource) =>
      resource === "audio_files"
        ? "uploadAudio"
        : `create${StringUtils.singularize(resource)}`,
    show: (resource) => `get${StringUtils.singularize(resource)}`,
    download: (resource) => `download${StringUtils.singularize(resource)}`,
    stream: (resource) => `stream${StringUtils.singularize(resource)}`,
    config: () => "getUploadConfig",
    backups: () => "getBackupFiles",
    backup_download: () => "downloadBackupFile",
    backup_stream: () => "streamBackupFile",
    transcript: () => "getTranscriptByAudioFile",
    query: () => "queryTranscript",
    "queries.store": () => "queryTranscript",
    "chunked.initialize": () => "initializeChunkedUpload",
    "chunked.upload": () => "uploadChunk",
    "chunked.finalize": () => "finalizeChunkedUpload",
    "chunked.cancel": () => "cancelChunkedUpload",
    "chunked.status": () => "getChunkedUploadStatus",
  },

  descriptions: {
    list: (resource) => `Get all ${resource.replace("_", " ")}`,
    create: (resource) =>
      `Create a new ${StringUtils.singularize(resource.replace("_", " "))}`,
    store: (resource) =>
      `Create a new ${StringUtils.singularize(resource.replace("_", " "))}`,
    show: (resource) =>
      `Get ${StringUtils.singularize(resource.replace("_", " "))} by ID`,
    download: (resource) =>
      `Download ${StringUtils.singularize(resource.replace("_", " "))} file`,
    stream: (resource) =>
      `Stream ${StringUtils.singularize(resource.replace("_", " "))} file`,
    config: () => "Get upload configuration",
    backups: () => "Get backup files list",
    backup_download: () => "Download backup file",
    backup_stream: () => "Stream backup file",
    transcript: () => "Get transcript for audio file",
    query: () => "Query transcript with AI",
    "chunked.initialize": () => "Initialize chunked upload session",
    "chunked.upload": () => "Upload a single chunk",
    "chunked.finalize": () => "Finalize chunked upload",
    "chunked.cancel": () => "Cancel chunked upload",
    "chunked.status": () => "Get chunked upload status",
  },
};

/**
 * Generate method name based on action key and resource
 */
function generateMethodName(actionKey, resource) {
  const generator = METHOD_MAPPINGS.names[actionKey];
  return generator ? generator(resource) : actionKey.replace(/[._]/g, "");
}

/**
 * Generate method description based on action key and resource
 */
function generateMethodDescription(actionKey, resource) {
  const generator = METHOD_MAPPINGS.descriptions[actionKey];
  return generator
    ? generator(resource)
    : `${StringUtils.capitalize(actionKey)} ${resource.replace("_", " ")}`;
}

// ========================================================================================
// REQUEST ANALYSIS AND IMPLEMENTATION GENERATION
// ========================================================================================

/**
 * Analyze request characteristics
 */
function analyzeRequest(actionKey, httpMethod, apiPath, resource) {
  const method = httpMethod.toUpperCase();
  return {
    hasIdParam: RouteUtils.hasParam(apiPath, "id"),
    hasFilenameParam: RouteUtils.hasParam(apiPath, "filename"),
    hasUploadIdParam: RouteUtils.hasParam(apiPath, "uploadId"),
    isUpload:
      method === "POST" &&
      resource === "audio_files" &&
      !apiPath.includes("/queries") &&
      !apiPath.includes("/chunked"),
    isChunkedUpload: apiPath.includes("/chunked"),
    isQuery: method === "POST" && apiPath.includes("/queries"),
    isDownloadOrStream:
      method === "GET" &&
      (actionKey.includes("download") || actionKey.includes("stream")),
  };
}

/**
 * Implementation generators for different types of operations
 */
const ImplementationGenerators = {
  upload: (apiPath) => ({
    params: ["file: File"],
    returnType: "Promise<ApiResponse<any>>",
    body: `
    const formData = new FormData();
    formData.append("audio_file", file);

    return this.request("${apiPath}", {
      method: "POST",
      body: formData,
    });`,
  }),

  chunkedUpload: (apiPath) => {
    if (apiPath.includes("/initialize")) {
      return {
        params: [
          "params: { filename: string; fileSize: number; totalChunks: number; mimeType: string }",
        ],
        returnType: "Promise<ApiResponse<any>>",
        body: `
    return this.request("${apiPath}", {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
      },
    });`,
      };
    }

    if (
      apiPath.includes("/upload") &&
      !RouteUtils.hasParam(apiPath, "uploadId")
    ) {
      return {
        params: [
          "params: { uploadId: string; chunkIndex: number; chunk: Blob; totalChunks: number }",
        ],
        returnType: "Promise<ApiResponse<any>>",
        body: `
    const formData = new FormData();
    formData.append("uploadId", params.uploadId);
    formData.append("chunkIndex", params.chunkIndex.toString());
    formData.append("totalChunks", params.totalChunks.toString());
    formData.append("chunk", params.chunk);

    return this.request("${apiPath}", {
      method: "POST",
      body: formData,
    });`,
      };
    }

    if (apiPath.includes("/finalize")) {
      const urlPath = RouteUtils.replaceParam(apiPath, "uploadId");
      return {
        params: ["uploadId: string"],
        returnType: "Promise<ApiResponse<any>>",
        body: `
    return this.request(\`${urlPath}\`, {
      method: "POST",
    });`,
      };
    }

    if (apiPath.includes("/cancel")) {
      const urlPath = RouteUtils.replaceParam(apiPath, "uploadId");
      return {
        params: ["uploadId: string"],
        returnType: "Promise<ApiResponse<any>>",
        body: `
    return this.request(\`${urlPath}\`, {
      method: "DELETE",
    });`,
      };
    }

    if (apiPath.includes("/status")) {
      const urlPath = RouteUtils.replaceParam(apiPath, "uploadId");
      return {
        params: ["uploadId: string"],
        returnType: "Promise<ApiResponse<any>>",
        body: `
    return this.request(\`${urlPath}\`);`,
      };
    }

    return ImplementationGenerators.generic(apiPath, "POST");
  },

  query: (apiPath, hasIdParam) => {
    const params = hasIdParam
      ? ["id: number", "query: string"]
      : ["query: string"];
    const urlPath = RouteUtils.replaceParam(apiPath, "id");
    return {
      params,
      returnType: "Promise<ApiResponse<any>>",
      body: `
    return this.request(\`${urlPath}\`, {
      method: "POST",
      body: { query },
    });`,
    };
  },

  download: (apiPath, hasIdParam, hasFilenameParam) => {
    const params = [];
    if (hasIdParam) params.push("id: number");
    if (hasFilenameParam) params.push("filename: string");

    let urlPath = apiPath;
    if (hasIdParam) urlPath = RouteUtils.replaceParam(urlPath, "id");
    if (hasFilenameParam)
      urlPath = urlPath.replace(
        "/{filename}",
        "/${encodeURIComponent(filename)}"
      );

    return {
      params,
      returnType: "Promise<Response>",
      body: `
    const url = \`${urlPath}\`;
    return fetch(url);`,
    };
  },

  get: (actionKey, apiPath, resource, hasIdParam) => {
    const params = hasIdParam ? ["id: number"] : [];
    const returnType =
      actionKey === "list" && resource === "audio_files"
        ? "Promise<ApiResponse<any[]>>"
        : "Promise<ApiResponse<any>>";
    const urlPath = RouteUtils.replaceParam(apiPath, "id");

    return {
      params,
      returnType,
      body: `
    return this.request(\`${urlPath}\`);`,
    };
  },

  generic: (apiPath, httpMethod) => {
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
  },
};

/**
 * Generate method implementation based on request characteristics
 */
function generateMethodImplementation(
  actionKey,
  httpMethod,
  apiPath,
  resource
) {
  const context = analyzeRequest(actionKey, httpMethod, apiPath, resource);

  if (context.isChunkedUpload) {
    return ImplementationGenerators.chunkedUpload(apiPath);
  }

  if (context.isUpload) {
    return ImplementationGenerators.upload(apiPath);
  }

  if (context.isQuery) {
    return ImplementationGenerators.query(apiPath, context.hasIdParam);
  }

  if (context.isDownloadOrStream) {
    return ImplementationGenerators.download(
      apiPath,
      context.hasIdParam,
      context.hasFilenameParam
    );
  }

  if (httpMethod === "GET") {
    return ImplementationGenerators.get(
      actionKey,
      apiPath,
      resource,
      context.hasIdParam
    );
  }

  return ImplementationGenerators.generic(apiPath, httpMethod);
}

// ========================================================================================
// ROUTE PROCESSING
// ========================================================================================

/**
 * Generate method from auto-discovered route
 */
function generateMethodFromDiscoveredRoute(route) {
  const { method: httpMethod, uri, name: routeName } = route;
  const { resource, action } = RouteUtils.parseRouteName(routeName);
  const apiPath = RouteUtils.cleanApiPath(uri);

  const methodName = generateMethodName(action, resource);
  const implementationDetails = generateMethodImplementation(
    action,
    httpMethod.toUpperCase(),
    apiPath,
    resource
  );
  const description = generateMethodDescription(action, resource);

  return {
    name: methodName,
    params: implementationDetails.params?.join(", ") || "",
    returnType: implementationDetails.returnType || "Promise<ApiResponse<any>>",
    description,
    implementation: implementationDetails.body,
  };
}

/**
 * Generate method from endpoint definition (fallback)
 */
function generateMethodFromEndpoint(actionKey, endpoint, resource) {
  if (typeof endpoint !== "string") return null;

  const [httpMethod, path] = endpoint.split(" ");
  const apiPath = RouteUtils.cleanApiPath(path);
  const methodName = generateMethodName(actionKey, resource);
  const implementation = generateMethodImplementation(
    actionKey,
    httpMethod,
    apiPath,
    resource
  );

  return {
    name: methodName,
    params: implementation.params.join(", "),
    returnType: implementation.returnType,
    implementation: implementation.body,
    description: generateMethodDescription(actionKey, resource),
  };
}

// ========================================================================================
// SERVICE FILE GENERATION
// ========================================================================================

/**
 * Generate resource service files from API documentation
 */
function generateResourceServices(apiDocs) {
  const resources = apiDocs.endpoints?.v1?.resources || {};
  const discoveredRoutes = apiDocs.endpoints?.discovered_routes || [];

  console.log(`Found ${Object.keys(resources).length} resource groups`);
  console.log(`Processing ${discoveredRoutes.length} auto-discovered routes`);

  // Group discovered routes by resource
  const routesByResource = {};
  discoveredRoutes.forEach((route) => {
    const resource = RouteUtils.extractResource(route.uri);
    if (!routesByResource[resource]) {
      routesByResource[resource] = [];
    }
    routesByResource[resource].push(route);
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

/**
 * Generate individual resource service file content
 */
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

/**
 * Generate resource class name
 */
function generateResourceClassName(resource) {
  const name = resource
    .split("-")
    .map((part) => StringUtils.capitalize(part))
    .join("");
  return `${name}Service`;
}

/**
 * Generate resource service instance name
 */
function generateResourceServiceName(resource) {
  const camelCaseName = StringUtils.toCamelCase(resource);
  return `${camelCaseName}Service`;
}

/**
 * Generate index file that exports all services
 */
function generateIndexFile(resourceKeys) {
  const imports = resourceKeys
    .map((resource) => {
      const camelCaseResource = StringUtils.toCamelCase(resource);
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
    const camelCaseProperty = StringUtils.toCamelCase(resource);
    const serviceName = generateResourceServiceName(resource);
    return `  ${camelCaseProperty}: ${serviceName},`;
  })
  .join("\n")}
};
`;
}

// ========================================================================================
// FILE MANAGEMENT
// ========================================================================================

/**
 * File management utilities
 */
const FileManager = {
  /**
   * Create backup of existing file
   */
  backupFile: (filename) => {
    if (fs.existsSync(filename)) {
      const backupFile = `${filename}.backup-${Date.now()}`;
      fs.copyFileSync(filename, backupFile);
      console.log(`Backed up existing ${filename} to: ${backupFile}`);
      return backupFile;
    }
    return null;
  },

  /**
   * Write content to file with backup
   */
  writeWithBackup: (filename, content) => {
    FileManager.backupFile(filename);
    fs.writeFileSync(filename, content);
    console.log(`Generated: ${filename}`);
  },

  /**
   * Ensure directory exists
   */
  ensureDir: (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },
};

// ========================================================================================
// MAIN EXECUTION
// ========================================================================================

/**
 * Main execution function
 */
async function main() {
  try {
    // Fetch API documentation
    const apiDocs = await fetchApiDocs();
    console.log("API documentation fetched successfully");

    // Generate resource-based service files
    const serviceFiles = generateResourceServices(apiDocs);
    const resourceKeys = Object.keys(serviceFiles);

    console.log(`Generated services for resources: ${resourceKeys.join(", ")}`);

    // Ensure output directory exists
    FileManager.ensureDir(CONFIG.OUTPUT_DIR);

    // Write each resource service file
    for (const [resource, content] of Object.entries(serviceFiles)) {
      const camelCaseResource = StringUtils.toCamelCase(resource);
      const filename = `${CONFIG.OUTPUT_DIR}/${camelCaseResource}Service.ts`;
      FileManager.writeWithBackup(filename, content);
    }

    // Generate and write index file
    const indexContent = generateIndexFile(resourceKeys);
    const indexFile = `${CONFIG.OUTPUT_DIR}/index.ts`;
    FileManager.writeWithBackup(indexFile, indexContent);

    // Calculate and display statistics
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

// Start the generation process
main();
