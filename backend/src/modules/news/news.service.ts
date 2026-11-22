import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";

export type NewsItem = {
    title: string;
    description: string;
    url: string;
    image: string | null;
    publishedAt: string;
    source: string;
};

type Entry = { at: number; items: NewsItem[] };

const TTL = 6 * 60 * 60 * 1000; // 6 hours, protects the 100 requests/day limit
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<NewsItem[]>>();

// "3M India Limited" -> "3M India"
function cleanName(name: string) {
    return name
        .replace(/\b(limited|ltd\.?|corporation|corp\.?)\b/gi, "")
        .replace(/[^\w\s&.-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

type GNewsArticle = {
    title?: string;
    description?: string;
    url?: string;
    image?: string | null;
    publishedAt?: string;
    source?: { name?: string };
};

async function callGNews(q: string): Promise<NewsItem[]> {
    const params = new URLSearchParams({
        q,
        lang: "en",
        country: "in",
        max: "10",
        sortby: "publishedAt",
        apikey: env.GNEWS_API_KEY,
    });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
        const res = await fetch(`https://gnews.io/api/v4/search?${params}`, {
            signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`GNews ${res.status}`);
        const data = (await res.json()) as { articles?: GNewsArticle[] };

        return (data.articles ?? [])
            .filter((a) => a.title && a.url && a.publishedAt)
            .map((a) => ({
                title: a.title!,
                description: a.description ?? "",
                url: a.url!,
                image: a.image ?? null,
                publishedAt: a.publishedAt!,
                source: a.source?.name ?? "News",
            }));
    } finally {
        clearTimeout(timer);
    }
}

function tidy(items: NewsItem[], name: string) {
    const needle = name.toLowerCase();
    const seen = new Set<string>();

    const unique = items.filter((i) => {
        const key = i.url || i.title.toLowerCase().replace(/\W+/g, " ");
        const titleKey = i.title.toLowerCase().replace(/\W+/g, " ");
        if (seen.has(key) || seen.has(titleKey)) return false;
        seen.add(key);
        seen.add(titleKey);
        return true;
    });

    const inTitle = (i: NewsItem) => i.title.toLowerCase().includes(needle);
    const inText = (i: NewsItem) => (i.title + " " + i.description).toLowerCase().includes(needle);

    // Headline mentions first, then other mentions, newest first inside each group
    return unique
        .filter(inText)
        .sort((a, b) => {
            const d = Number(inTitle(b)) - Number(inTitle(a));
            return d !== 0 ? d : b.publishedAt.localeCompare(a.publishedAt);
        })
        .slice(0, 10);
}

async function fetchFresh(name: string) {
    let items = await callGNews(`"${name}" AND (stock OR shares OR results OR earnings)`);
    if (items.length === 0) items = await callGNews(`"${name}"`);
    return tidy(items, name);
}

export async function getNews(symbol: string) {
    const key = symbol.toUpperCase();

    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) {
        return { items: hit.items, stale: false, fetchedAt: new Date(hit.at).toISOString() };
    }

    const stock = await prisma.stock.findUnique({
        where: { symbol: key },
        select: { name: true },
    });
    if (!stock) return null;
    const name = cleanName(stock.name);

    // If several people open the same stock at once, make only one request
    let job = inflight.get(key);
    if (!job) {
        job = fetchFresh(name).finally(() => inflight.delete(key));
        inflight.set(key, job);
    }

    try {
        const items = await job;
        const at = Date.now();
        cache.set(key, { at, items });
        return { items, stale: false, fetchedAt: new Date(at).toISOString() };
    } catch (e) {
        // Provider down or limit reached: show the last copy if we have one
        if (hit) {
            return { items: hit.items, stale: true, fetchedAt: new Date(hit.at).toISOString() };
        }
        throw e;
    }
}