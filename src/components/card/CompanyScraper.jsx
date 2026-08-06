import React, { useState } from "react";
import { Globe, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CompanyScraper({ onPopulate, notify }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const scrape = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Research the company at this website: ${url}. Extract their business information for a digital business card and brochure. Return JSON with: company_name, tagline (short catchy phrase), bio (2-3 sentences about the company), services (array of 4-6 short service names), phone, email, address, website, social (object with facebook, instagram, linkedin URLs if found). Use empty string for any field not found.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            company_name: { type: "string" }, tagline: { type: "string" }, bio: { type: "string" },
            services: { type: "array", items: { type: "string" } },
            phone: { type: "string" }, email: { type: "string" }, address: { type: "string" }, website: { type: "string" },
            social: { type: "object", properties: { facebook: { type: "string" }, instagram: { type: "string" }, linkedin: { type: "string" } } },
          },
        },
      });
      onPopulate(res);
      notify && notify("Company data imported");
    } catch (e) {
      notify && notify("Scrape failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hx-scraper-form">
      <div className="hx-bid-input-label"><Globe size={15} /> Company Website Scraper</div>
      <p style={{ fontSize: 11, color: "#A0A0A0", margin: 0 }}>Enter your company URL — AI researches the site and auto-fills your card & brochure.</p>
      <div className="hx-scraper-search">
        <Globe size={16} />
        <input placeholder="https://yourcompany.com" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <button className="gold-button" style={{ justifyContent: "center" }} onClick={scrape} disabled={loading || !url}>
        {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
        {loading ? "Researching…" : "Scrape & Populate"}
      </button>
    </div>
  );
}