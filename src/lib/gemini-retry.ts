export async function withGeminiRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "";

      const isRetryable =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("high demand") ||
        message.includes("429") ||
        message.includes("RESOURCE_EXHAUSTED");

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay =
        1000 * 2 ** attempt +
        Math.floor(Math.random() * 500);

      console.log(
        `Gemini request failed. Retrying in ${delay}ms...`,
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay),
      );
    }
  }

  throw new Error("Gemini request failed");
}