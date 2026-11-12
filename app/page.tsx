import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import RouteMap from "@/components/route-map";
import TicketCard from "@/components/ticket-card";
import { timeInStage } from "@/lib/board-utils";
import { homeMetadata } from "@/lib/site";

export const metadata = homeMetadata;

const STAGES = [
  { name: "Wish List", color: "var(--stage-wish)", text: "Save roles the moment you find them, with the link and salary." },
  { name: "Applied", color: "var(--stage-applied)", text: "Drag the card over when you send it, so you know what's waiting." },
  { name: "Interviewing", color: "var(--stage-interviewing)", text: "Keep recruiter names and next steps in the card's notes." },
  { name: "Offer", color: "var(--stage-offer)", text: "Line up offers side by side when it's time to decide." },
  { name: "Rejected", color: "var(--stage-rejected)", text: "Closed roles stay on the board, so nothing is applied to twice." },
];

// Static examples use a fixed "now" so the time-in-stage text never changes between renders.
const EXAMPLE_NOW = Date.UTC(2026, 10, 12, 12);
const daysAgo = (n: number) => new Date(EXAMPLE_NOW - n * 86_400_000).toISOString();

const FAQ = [
  {
    q: "Does it cost anything?",
    a: "No. Create an account and your board is ready to use.",
  },
  {
    q: "Who can see my board?",
    a: "Only you, while signed in. Every change to a card is checked against your account before it is saved.",
  },
  {
    q: "Can I move cards without a mouse?",
    a: "Yes. Every card's menu has a Move to list that works from the keyboard. You can also focus a card, press Space to pick it up, use the arrow keys, and press Space again to drop it.",
  },
  {
    q: "Can I rename or add columns?",
    a: "Not yet. Every board has the same five columns, from Wish List to Rejected.",
  },
  {
    q: "What happens when I delete a card?",
    a: "Cardfile asks you to confirm first. Once deleted, the card and its notes are gone for good, so move closed roles to Rejected if you want to keep them.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. Swipe sideways to see each column, and use a card's menu to move it.",
  },
];

const ANATOMY = [
  { key: "A", term: "Bullet, role and company", text: "The company's initials in a round bullet, coloured by the card's stage, so cards are easy to spot in a long column." },
  { key: "B", term: "Description", text: "A line or two on what the role involves, so you can compare offers later." },
  { key: "C", term: "Location and salary", text: "The practical details, kept on the face of the card." },
  { key: "D", term: "Tags", text: "Your own labels: the stack, Remote, Referral, anything you sort by." },
  { key: "E", term: "Progress and time in stage", text: "How far along the line the card is, and how long it has sat there. A long wait in Applied is a cue to follow up." },
  { key: "F", term: "Notes and posting link", text: "A marker when the card has notes, and a link to the original job ad." },
];

function CardAnatomy() {
  return (
    <section aria-labelledby="anatomy-heading">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div className="order-2 px-9 md:order-1">
          {/* Illustration only: the list beside it describes every part. */}
          <div className="relative max-w-sm" aria-hidden="true" inert>
            <TicketCard
              className="shadow-(--lift-shadow)"
              position="Product Manager"
              company="WorkLab"
              stageName="Interviewing"
              stageColor="var(--stage-interviewing)"
              description="Lead planning for the scheduling product with design and two engineering teams."
              location="Seattle, WA"
              salary="$140k–$170k"
              tags={["Agile", "Referral"]}
              jobUrl="https://worklab.example/jobs/9"
              notes="Recruiter: Sam. Panel interview Thursday."
              since={daysAgo(3)}
              stageAgeOverride={timeInStage(daysAgo(3), EXAMPLE_NOW) ?? undefined}
              markers={{ header: "A", description: "B", meta: "C", tags: "D", stub: "E", extras: "F" }}
            />
          </div>
        </div>
        <div className="order-1 md:order-2">
          <h2 id="anatomy-heading" className="font-heading text-4xl font-extrabold leading-none text-ink sm:text-5xl">
            Everything about a role, on one card
          </h2>
          <p className="mt-3 max-w-md text-graphite">
            Only the company and position are required. Add the rest when you know it.
          </p>
          <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {ANATOMY.map((item) => (
              <div key={item.key} className="flex gap-3">
                <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-paper">
                  {item.key}
                </span>
                <div>
                  <dt className="font-semibold text-ink">{item.term}</dt>
                  <dd className="mt-0.5 text-[0.95rem] leading-relaxed text-graphite">{item.text}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-x-10 gap-y-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1fr_1.05fr]">
        <div className="max-w-xl">
          <h1 className="font-heading text-[clamp(3.25rem,8vw,6rem)] font-extrabold leading-[0.9] text-ink">
            Every application, on one board.
          </h1>
          <p className="mt-6 max-w-[34rem] text-xl leading-relaxed text-graphite">
            Save the roles you want, log where you&apos;ve applied, and move each card down the line as
            interviews come in. Your whole search, in five stops.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg", className: "h-12 px-6 text-lg" })}>
              Create your board
            </Link>
            <Link
              href="/signin"
              className={buttonVariants({ size: "lg", variant: "ghost", className: "h-12 px-4 text-lg" })}
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-[0.9375rem] text-graphite">Free to use. Your board is visible only to you.</p>
        </div>

        {/* Illustration only. On wide screens the sample card sits in the map's empty corner. */}
        <div className="relative" aria-hidden="true" inert>
          <RouteMap className="h-auto w-full" />
          <div className="mt-6 max-w-[18rem] lg:absolute lg:left-0 lg:top-0 lg:mt-0 lg:w-[17.5rem]">
            <TicketCard
              className="shadow-(--lift-shadow)"
              position="Product Designer"
              company="Wise"
              stageName="Interviewing"
              stageColor="var(--stage-interviewing)"
              location="London"
              salary="£85k–£95k"
              tags={["Figma", "Referral"]}
              notes="Portfolio review Thursday 10:00"
              since={daysAgo(3)}
              stageAgeOverride={timeInStage(daysAgo(3), EXAMPLE_NOW) ?? undefined}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="stages-heading" className="bg-desk">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <h2 id="stages-heading" className="font-heading text-4xl font-extrabold leading-none text-ink sm:text-5xl">
            Five stages, left to right
          </h2>
          <p className="mt-3 max-w-xl text-graphite">
            Every card travels the same way: drag it to the next column, or pick a column from its menu.
          </p>
          <ol className="route route--across mt-12" style={{ "--paper": "var(--desk)" } as React.CSSProperties}>
            {STAGES.map((stage) => (
              <li key={stage.name} className="route__stop" style={{ "--stage": stage.color } as React.CSSProperties}>
                <p className="font-heading text-2xl font-bold leading-tight text-ink">{stage.name}</p>
                <p className="mt-1.5 max-w-[26rem] leading-relaxed text-graphite">{stage.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CardAnatomy />

      <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 md:pb-24">
        <div className="grid grid-cols-1 gap-10 border-t-2 border-ink pt-12 md:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 id="faq-heading" className="font-heading text-4xl font-extrabold leading-none text-ink sm:text-5xl">
              Questions
            </h2>
            <p className="mt-3 max-w-xs text-graphite">
              Anything else? The <Link href="/guide" className="text-ink underline underline-offset-2">guide</Link>{" "}
              walks through the board step by step.
            </p>
          </div>
          <div className="divide-y divide-rule border-b border-rule">
            {FAQ.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-4 font-heading text-xl font-bold text-ink first:pt-0 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-desk font-sans text-lg font-medium leading-none text-ink transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[60ch] pb-5 leading-relaxed text-graphite">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-heading" className="bg-ink text-paper">
        {/* The line's five colours, end to end. */}
        <div className="flex h-1.5" aria-hidden="true">
          {STAGES.map((stage) => (
            <span key={stage.name} className="flex-1" style={{ background: stage.color }} />
          ))}
        </div>
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="cta-heading" className="font-heading text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[0.95]">
              Your next application starts as a card.
            </h2>
            <p className="mt-3 text-lg text-paper/75">It takes a minute to set up. The five columns are ready for you.</p>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-12 shrink-0 items-center rounded-lg bg-paper px-6 text-lg font-medium text-ink transition-colors hover:bg-paper/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
          >
            Create your board
          </Link>
        </div>
      </section>
    </>
  );
}
