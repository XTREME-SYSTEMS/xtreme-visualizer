import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/vq/PageHeader";
import SectionCard from "@/components/vq/SectionCard";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Loader2, Mail, Calendar, Trash2, AlertTriangle } from "lucide-react";
import AppUserConnector from "@/components/settings/AppUserConnector";
import PricingProfileEditor from "@/components/pricing/PricingProfileEditor";
import CostOfBusinessCalculator from "@/components/pricing/CostOfBusinessCalculator";
import AccentColorPicker from "@/components/settings/AccentColorPicker";
import HeroImagePicker from "@/components/settings/HeroImagePicker";
import BrandingCustomizer from "@/components/settings/BrandingCustomizer";
import PWAButtonCustomizer from "@/components/settings/PWAButtonCustomizer";
import HeroTextCustomizer from "@/components/settings/HeroTextCustomizer";

const GMAIL_CONNECTOR_ID = "69db200274332486fd28dd7e";
const CALENDAR_CONNECTOR_ID = "69ddcb305a599e0b4a1b3cff";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const authed = await base44.auth.isAuthenticated();
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
      setLoading(false);
    })();
  }, []);

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.entities.User.delete(user.id);
      await base44.auth.logout();
      window.location.href = "/";
    } catch (e) {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="py-24 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--vx-faint)]" /></div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Connect your Gmail to email customers proposals, concept images, and AI-drafted replies — all from your own inbox."
      />
      <SectionCard index="01" title="Google connections" tag="Integrations">
        <p className="text-[12px] text-[var(--vx-muted)] mb-4">Connect your own Google accounts so the app can email customers proposals and sync appointments to your calendar.</p>
        <AppUserConnector
          connectorId={GMAIL_CONNECTOR_ID}
          icon={Mail}
          label="Gmail"
          description="Send proposals, concept images, and AI-drafted replies — all from your own inbox."
          checkFn={() => base44.functions.invoke("gmail", { action: "list" })}
          user={user}
        />
        <div className="my-4 h-px bg-[var(--vx-border-soft)]" />
        <AppUserConnector
          connectorId={CALENDAR_CONNECTOR_ID}
          icon={Calendar}
          label="Google Calendar"
          description="Sync site visits and consultations straight to your own Google Calendar."
          checkFn={() => base44.functions.invoke("createCalendarAppointment", { ping: true })}
          user={user}
        />
      </SectionCard>

      <SectionCard index="02" title="Accent color" tag="Appearance">
        <AccentColorPicker />
      </SectionCard>

      <SectionCard index="03" title="Home hero image" tag="Appearance">
        <HeroImagePicker />
      </SectionCard>

      <SectionCard index="04" title="Hero text & fonts" tag="Appearance">
        <HeroTextCustomizer />
      </SectionCard>

      <SectionCard index="05" title="Branding" tag="Appearance">
        <BrandingCustomizer />
      </SectionCard>

      <SectionCard index="06" title="PWA install button" tag="Appearance">
        <PWAButtonCustomizer />
      </SectionCard>

      <SectionCard index="07" title="Standard pricing" tag="Your rates">
        <p className="text-[12px] text-[var(--vx-muted)] mb-4">Set your standard rates once — the competitive pricing builder uses these to pre-fill fuel, labor, and material costs.</p>
        <PricingProfileEditor />
      </SectionCard>

      <SectionCard index="08" title="Cost of doing business" tag="Overhead">
        <p className="text-[12px] text-[var(--vx-muted)] mb-4">Account for labor burden, insurance, fuel, vehicle, equipment, software/AI, IT, and more — the calculator outputs your burdened hourly rate and overhead to apply to every quote.</p>
        <CostOfBusinessCalculator />
      </SectionCard>

      <SectionCard index="09" title="Account management" tag="Danger zone">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-red-50 grid place-items-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </span>
            <div>
              <p className="text-[13px] font-medium text-[var(--vx-text)]">Delete account</p>
              <p className="text-[12px] text-[var(--vx-muted)]">Permanently remove your account and all associated data. This action cannot be undone.</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="shrink-0">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all associated data. This action cannot be undone. You will be signed out immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); deleteAccount(); }}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SectionCard>
    </div>
  );
}