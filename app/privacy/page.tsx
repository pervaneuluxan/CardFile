import ProsePage, { ProseSection } from "@/components/prose-page";
import { BRAND } from "@/lib/brand";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Privacy",
  description: `What ${BRAND.name} stores about you and who can see it.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <ProsePage
      title="What we keep, and why"
      lede={`${BRAND.name} stores only what it needs to show you your own board. This page describes how the app works; it is not a legal agreement.`}
    >
      <ProseSection id="account" title="Your account">
        <p>
          Your name, email address and password, used to sign you in. Passwords are stored as a one-way hash, never
          as the text you typed.
        </p>
      </ProseSection>

      <ProseSection id="applications" title="Your applications">
        <p>
          Everything you put on a card: company, position, location, salary, the posting link, tags, description and
          notes, plus which column it&apos;s in. Only your signed-in account can read or change these cards; the
          server checks ownership on every change.
        </p>
      </ProseSection>

      <ProseSection id="cookies" title="Cookies and browser storage">
        <p>
          A session cookie keeps you signed in. Your light or dark theme choice, and the fact that you&apos;ve
          dismissed the cookie notice, are kept in this browser&apos;s local storage and never leave your device.
          There are no advertising or analytics cookies, so there is nothing to opt out of.
        </p>
      </ProseSection>

      <ProseSection id="deleting" title="Deleting your data">
        <p>
          Deleting a card removes it and its notes permanently. Deleting a whole account isn&apos;t available in the
          app yet; ask whoever runs your {BRAND.name} installation to remove it.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
