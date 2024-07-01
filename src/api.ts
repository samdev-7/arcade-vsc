import axios from "axios";
import { AxiosResponse, AxiosError } from "axios";

const HH_ENDPOINT = "https://hackhour.hackclub.com";

axios.interceptors.request.use((config) => {
  config.headers["User-Agent"] = "Arcade VSC Extension";
  return config;
});

export async function retrier<T>(
  fn: () => Promise<T>,
  name: string = "",
  max_retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    console.warn(
      `Retrying${name ? " " + name : ""}... ${
        max_retries - 1
      } retries left: ${err}`
    );
    if (max_retries <= 1) {
      throw err;
    }
    return await new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          resolve(await retrier(fn, name, max_retries - 1, delay * 4));
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

export async function getStatus(): Promise<boolean> {
  let resp: AxiosResponse<RawStatusData>;
  try {
    resp = await axios.get(HH_ENDPOINT + "/status");
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
    work: string;
    goal: string;
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
  work: string;
  goal: string;
};

export async function getSession(key: string): Promise<SessionData | null> {
  if (key === "") {
    throw new Error("Error while fetching session: API key cannot be empty");
  }

  let resp: AxiosResponse<RawSessionData | RawSessionError>;
  try {
    resp = await axios.get(HH_ENDPOINT + "/api/session/", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response === undefined) {
        throw new Error(`Error while fetching session: ${err}`);
      }

      resp = err.response;
    } else {
      throw new Error(`Error while fetching session: ${err}`);
    }
  }

  if (resp.status !== 200 && resp.status !== 404 && resp.status !== 401) {
    throw new Error(
      `Error while fetching session: Unexpected status code ${resp.status}`
    );
  }

  const data = resp.data;

  if (
    !data.ok &&
    (data.error === "User not found" || data.error === "Unauthorized")
  ) {
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
    work: data.data.work,
    goal: data.data.goal,
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

export async function getStats(key: string): Promise<StatsData | null> {
  if (key === "") {
    throw new Error("Error while fetching session: API key cannot be empty");
  }

  let resp: AxiosResponse<RawStatsData | RawStatsError>;
  try {
    resp = await axios.get(HH_ENDPOINT + "/api/stats/", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response === undefined) {
        throw new Error(`Error while fetching session: ${err}`);
      }

      resp = err.response;
    } else {
      throw new Error(`Error while fetching session: ${err}`);
    }
  }

  if (resp.status !== 200 && resp.status !== 404 && resp.status !== 401) {
    throw new Error(
      `Error while fetching session: Unexpected status code ${resp.status}`
    );
  }

  const data = resp.data;

  if (
    !data.ok &&
    (data.error === "User not found" || data.error === "Unauthorized")
  ) {
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

type RawStartError = {
  ok: false;
  error: string;
};

type RawStartData = {
  ok: true;
  data: {
    id: string;
    slackId: string;
    createdAt: string;
  };
};

export async function startSession(key: string): Promise<void> {
  throw new Error("Not implemented");
}

type RawPauseError = {
  ok: false;
  error: string;
};

type RawPauseData = {
  ok: true;
  data: {
    id: string;
    slackId: string;
    createdAt: string;
    paused: boolean;
  };
};

export type PauseData = {
  paused: boolean;
};

export async function pauseSession(key: string): Promise<PauseData> {
  throw new Error("Not implemented");
}

type RawEndError = {
  ok: false;
  error: string;
};

type RawEndData = {
  ok: true;
  data: {
    id: string;
    slackId: string;
    createdAt: string;
  };
};

export async function endSession(key: string): Promise<void> {
  throw new Error("Not implemented");
}
