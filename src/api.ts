import axios from "axios";
import { AxiosResponse, AxiosError } from "axios";

const hhEndpoint = "https://hackhour.hackclub.com";

axios.interceptors.request.use((config) => {
  config.headers["User-Agent"] = "Arcade VSC Extension";
  return config;
});

export async function retrier<T>(
  fn: () => Promise<T>,
  max_retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    console.warn(
      `Retrying${fn.name ? " " + fn.name : ""}... ${
        max_retries - 1
      } retries left: ${err}`
    );
    if (max_retries <= 1) {
      throw err;
    }
    return await new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          resolve(await retrier(fn, max_retries - 1, delay));
        } catch (err) {
          reject(err);
        }
      }, delay);
    });
  }
}

type RawStatusData = {
  activeSessions: number;
  airtableConnected: boolean;
  slackConnected: boolean;
};

export async function getStatus(max_retries = 0): Promise<boolean> {
  let resp: AxiosResponse<RawStatusData>;
  try {
    resp = await axios.get(hhEndpoint + "/status");
  } catch (err) {
    console.error(`Error while fetching status: ${err}`);
    return false;
  }

  if (resp.status !== 200) {
    return false;
  }

  const data = resp.data;

  return data.airtableConnected && data.slackConnected;
}

type RawSessionData = {
  ok: true;
  data: {
    id: string;
    createdAt: string;
    time: number;
    elapsed: number;
    remaining: number;
    endTime: string;
    paused: boolean;
    completed: boolean;
  };
};

type RawSessionError = {
  ok: false;
  error: string;
};

export type SessionData = {
  createdAt: Date;
  time: number;
  elapsed: number;
  remaining: number;
  endTime: Date;
  paused: boolean;
  completed: boolean;
};

export async function getSession(id: string): Promise<SessionData | null> {
  if (id === "") {
    throw new Error("Error while fetching session: ID cannot be empty");
  }

  let resp: AxiosResponse<RawSessionData | RawSessionError>;
  try {
    resp = await axios.get(hhEndpoint + "/api/session/" + id);
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response === undefined || err.response.status !== 404) {
        throw new Error(`Error while fetching session: ${err}`);
      }

      resp = err.response;
    } else {
      throw new Error(`Error while fetching session: ${err}`);
    }
  }

  if (resp.status !== 200 && resp.status !== 404) {
    throw new Error(
      `Error while fetching session: Unexpected status code ${resp.status}`
    );
  }

  const data = resp.data;

  if (!data.ok && data.error === "User not found") {
    return null;
  } else if (!data.ok) {
    throw new Error(
      `Error while fetching session: Unexpected result of ${JSON.stringify(
        data
      )}`
    );
  }

  return {
    createdAt: new Date(data.data.createdAt),
    time: data.data.time,
    elapsed: data.data.elapsed,
    remaining: data.data.remaining,
    endTime: new Date(data.data.endTime),
    paused: data.data.paused,
    completed: data.data.completed,
  };
}

type RawStatsData = {
  ok: true;
  data: {
    sessions: number;
    total: number;
  };
};

type RawStatsError = {
  ok: false;
  error: string;
};

export type StatsData = {
  sessions: number;
  total: number;
};

export async function getStats(id: string): Promise<StatsData | null> {
  if (id === "") {
    throw new Error("Error while fetching session: ID cannot be empty");
  }

  let resp: AxiosResponse<RawStatsData | RawStatsError>;
  try {
    resp = await axios.get(hhEndpoint + "/api/stats/" + id);
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response === undefined || err.response.status !== 404) {
        throw new Error(`Error while fetching session: ${err}`);
      }

      resp = err.response;
    } else {
      throw new Error(`Error while fetching session: ${err}`);
    }
  }

  if (resp.status !== 200 && resp.status !== 404) {
    throw new Error(
      `Error while fetching session: Unexpected status code ${resp.status}`
    );
  }

  const data = resp.data;

  if (!data.ok && data.error === "User not found") {
    return null;
  } else if (!data.ok) {
    throw new Error(
      `Error while fetching session: Unexpected result of ${JSON.stringify(
        data
      )}`
    );
  }

  return {
    sessions: data.data.sessions,
    total: data.data.total,
  };
}
