export function getPostgresConnectionOptions(databaseUrl: string) {
  const hostname = new URL(databaseUrl).hostname;
  const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    hostname,
  );

  return {
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: isLocal ? false : { rejectUnauthorized: true },
  };
}
