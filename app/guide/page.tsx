import Link from "next/link";
import ProsePage, { ProseSection } from "@/components/prose-page";
import { BRAND } from "@/lib/brand";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Guide",
  description: `How to add, move and close out job applications on your ${BRAND.name} board.`,
  path: "/guide",
});

const STEPS = [
  {
    title: "Create your account",
    body: (
      <>
        <Link href="/signup" className="text-ink underline underline-offset-2">Create an account</Link> with your
        name, email and a password of at least 8 characters. Your board opens straight away with five columns:
        Wish List, Applied, Interviewing, Offer and Rejected.
      </>
    ),
  },
  {
    title: "Add an application",
    body: (
      <>
        Choose <strong>Add application</strong> at the bottom of the column it belongs in. Company and position are
        required; location, salary, the posting link, tags, a description and notes are optional and can be added
        later.
      </>
    ),
  },
  {
    title: "Move it forward",
    body: (
      <>
        Drag the card to the next column when something changes. You can also open the card&apos;s menu (the
        <span aria-hidden="true"> ··· </span>button) and pick a column under <strong>Move to</strong>. Moves save as
        soon as you drop the card. If a save fails, the card goes back where it was and the board tells you.
      </>
    ),
  },
  {
    title: "Keep the details current",
    body: (
      <>
        Use <strong>Edit details</strong> in the card&apos;s menu to add the recruiter&apos;s name, interview times
        or follow-up dates to the notes. Notes don&apos;t show on the card face, so they stay out of the way.
      </>
    ),
  },
  {
    title: "Close it out",
    body: (
      <>
        Move roles that didn&apos;t work out to <strong>Rejected</strong> to keep a record of where you&apos;ve
        applied. <strong>Delete</strong> removes a card and its notes permanently, after you confirm.
      </>
    ),
  },
];

// One line colour per step, in board order.
const STEP_COLORS = [
  "var(--stage-wish)",
  "var(--stage-applied)",
  "var(--stage-interviewing)",
  "var(--stage-offer)",
  "var(--stage-rejected)",
];

const KEYS = [
  { keys: ["Tab"], action: "Move between cards and buttons" },
  { keys: ["Space"], action: "Pick up the focused card, or drop the card you're holding" },
  { keys: ["←", "→", "↑", "↓"], action: "Move the card you're holding between and within columns" },
  { keys: ["Esc"], action: "Put the card back where it started" },
];

export default function GuidePage() {
  return (
    <ProsePage
      title="Using your board"
      lede={`${BRAND.name} follows one application from the moment you find it to the day it closes. Here's the whole routine.`}
    >
      {/* The steps are a real sequence, so they are drawn as stops along the line. */}
      <ol className="route">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="route__stop"
            style={{ "--stage": STEP_COLORS[i % STEP_COLORS.length] } as React.CSSProperties}
          >
            <h2 className="font-heading text-2xl font-bold leading-tight text-ink">{step.title}</h2>
            <p className="mt-1.5 max-w-[62ch] leading-relaxed text-ink/85">{step.body}</p>
          </li>
        ))}
      </ol>

      <ProseSection id="keyboard" title="Keyboard controls">
        <p>Every part of the board works without a mouse.</p>
        <table className="w-full border-collapse text-left text-[0.95rem]">
          <thead>
            <tr className="border-b border-rule text-graphite">
              <th scope="col" className="py-2 pr-6 font-normal">Key</th>
              <th scope="col" className="py-2 font-normal">What it does</th>
            </tr>
          </thead>
          <tbody>
            {KEYS.map((row) => (
              <tr key={row.action} className="border-b border-rule align-top">
                <td className="whitespace-nowrap py-3 pr-6">
                  {row.keys.map((k) => (
                    <kbd
                      key={k}
                      className="mr-1 inline-block min-w-7 rounded border border-rule bg-card px-1.5 py-0.5 text-center font-sans text-sm text-ink shadow-[0_1px_0_var(--rule)]"
                    >
                      {k}
                    </kbd>
                  ))}
                </td>
                <td className="py-3 text-ink/85">{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ProseSection>

      <ProseSection id="theme" title="Light and dark">
        <p>
          The switch in the top bar flips between the light and dark theme. Until you use it, {BRAND.name}{" "}
          follows your device&apos;s setting. Your choice is remembered on this browser.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
