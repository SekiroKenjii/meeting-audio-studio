export const formatDuration = (duration?: number) => {
  if (!duration) return "—";
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "—";

  try {
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error, "Input:", dateString);
    return "Invalid Date";
  }
};

export const formatFileSize = (size?: number | string | null) => {
  if (!size) return "—";

  // Convert string to number if needed
  const sizeNumber = typeof size === "string" ? parseInt(size, 10) : size;

  if (isNaN(sizeNumber) || sizeNumber <= 0) return "—";

  const mb = sizeNumber / (1024 * 1024);
  return mb >= 1
    ? `${mb.toFixed(1)} MB`
    : `${(sizeNumber / 1024).toFixed(0)} KB`;
};
