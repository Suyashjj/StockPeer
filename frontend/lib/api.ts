const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiOptions = {
    method?: string;
    body?: unknown;
};

type ApiResponse<T> = {
    ok: boolean;
    status: number;
    data: T;
};

export async function api<T = any>(
    path: string,
    options: ApiOptions = {}
): Promise<ApiResponse<T>> {
    const isFormData = options.body instanceof FormData;

    try {
        const res = await fetch(`${API_URL}${path}`, {
            method: options.method ?? "GET",
            credentials: "include", // sends and receives the httpOnly cookie
            headers: isFormData ? undefined : { "Content-Type": "application/json" },
            body:
                options.body === undefined
                    ? undefined
                    : isFormData
                      ? (options.body as FormData)
                      : JSON.stringify(options.body),
        });

        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    } catch {
        // Network failure: server is down, no internet, CORS blocked, etc.
        return {
            ok: false,
            status: 0,
            data: { message: "Cannot reach the server. Please try again." } as T,
        };
    }
}
