interface E2EUserConfig {
  id: string;
  email: string;
  password: string;
}

function readEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env variable: ${key}. Set it in .env.test or your shell.`);
  }
  return value;
}

export function getE2EUser(): E2EUserConfig {
  return {
    id: readEnv("E2E_USERNAME_ID"),
    email: readEnv("E2E_USERNAME"),
    password: readEnv("E2E_PASSWORD"),
  };
}


