import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/vq/PageHeader";
import EmptyState from "@/components/vq/EmptyState";
import { money } from "@/lib/pricing";
import { Loader2, Package, ExternalLink, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const pretty = (c) => (c || "").replace(/_/g, " ");

export default function Products() {
  const [items, setItems] = useState(null);
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => { base44.entities.Product.list("-created_date", 200).then(setItems); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("scrapeXpsCatalog", { maxPages: 5 });
      const d = res.data;
      toast({ title: "Catalog synced", description: `${d.scrapedCount} scraped · ${d.created} new · ${d.updated} updated` });
      const fresh = await base44.entities.Product.list("-created_date", 200);
      setItems(fresh);
    } catch (e) {
      toast({ variant: "destructive", title: "Sync failed", description: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const categories = useMemo(() => {
    if (!items) return ["all"];
    return ["all", ...Array.from(new Set(items.map((p) => p.category).filter(Boolean))).sort()];
  }, [items]);

  const shown = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (!q) return true;
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        pretty(p.category).toLowerCase().includes(q)
      );
    });
  }, [items, cat, query]);

  if (!items) {
    return (
      <div className="py-24 grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--vx-accent)" }} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Product base · Xtreme Polishing Systems"
        title="Products and pricing"
        description="Real XPS products scraped from xtremepolishingsystems.com — epoxy kits, polyaspartics, pigments, sealers, flakes, quartz, equipment, and tooling. These power the pricing engine and specs."
        action={
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync catalog"}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, SKU, category…"
            className="pl-9 h-10"
          />
        </div>
        <span className="text-[12px] text-muted-foreground">
          {shown.length} of {items.length} products
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors capitalize ${
              cat === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
            }`}
          >
            {c === "all" ? "All" : pretty(c)}
          </button>
        ))}
      </div>

      {!shown.length ? (
        <EmptyState icon={Package} title="No products match" hint="Try a different category or search term." />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col transition-colors hover:border-primary/50">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-semibold text-foreground leading-tight">{p.name}</p>
                <span className="text-[10px] uppercase tracking-[0.1em] text-primary shrink-0 capitalize">{pretty(p.category)}</span>
              </div>
              {p.sku && <p className="mt-1 font-mono text-[11px] text-muted-foreground">{p.sku}</p>}
              {p.size && <p className="mt-1 text-[12px] text-muted-foreground">{p.size}</p>}
              <p className="mt-3 text-[16px] font-semibold text-primary">
                {money(p.price)}
                {p.price_unit && <span className="text-[11px] font-normal text-muted-foreground ml-1">{p.price_unit}</span>}
              </p>
              {p.specs && <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{p.specs}</p>}
              <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                {p.vendor && <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{p.vendor}</span>}
                {p.product_url && (
                  <a href={p.product_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline ml-auto">
                    View on XPS <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}