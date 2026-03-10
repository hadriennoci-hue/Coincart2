import Link from "next/link";
import { AnimatedGroup } from "../../components/ui/AnimatedGroup";

export const runtime = 'edge';

const faqItems = [
  {
    question: "What informations are required to complete my order ?",
    answer:
      "Coincart only needs shipping informations: shipping address, contact name, phone and email for tracking.",
  },
  {
    question: "What cryptocurrencies do you accept ?",
    answer:
      "We accept: USDC, USDT, BTC, XMR, ZEC, SOL, ETH. Our payment processor is BTCPay Server.",
  },
  {
    question: "How does the warranty work ?",
    answer:
      "Laptops, Desktops, monitors, GPUs are under two years constructor warranty (see product specifications). If you need to activate warranty, you will have to contact Coincart support with Serial Number + proof (photo), and then send the product back to ACER. We will connect you with the proper ACER support.",
  },
  {
    question: "Why is shipping more costly for non local keyboards ?",
    answer:
      "For example, lets say you want to ship a german QWERTZ laptop to a french adress. Coincart needs to comply with ACER / EU VAT rules, which means we need to ship the laptop first to Germany, then reship it to France. Shipping is therefore more expensive and takes longer. When ordering a non local keyboard, please make sure you pick the non-local shipping option at checkout. Please note that Switzerland and United Kingdom can only ship local keyboards because they are not part of EU.",
  },
  {
    question: "What countries are currently covered ?",
    answer:
      "We cover Europe. For large orders superior to 20K$ to other continents: send DM describing your order & shipping destination.",
  },
  {
    question: "How can I contact Coincart customer support ?",
    answer:
      "Our customer service team is available to assist you via the contact form or via telegram. We will respond to all inquiries within 24 hours.",
  },
  {
    question: "What is the return policy?",
    answer:
      "If you change your mind, you have 15 days to return the product in its original packaging. Shipping fees will not be refunded by Coincart. Please use the contact form, and provide the email you used for purchase as well as product serial number and proof (photo). We will provide you with ACER Support contact, which will ask about Product Serial Number, and will give you shipping information (Poland). Upon reception and inspection of the product by ACER STORE, Coincart will initiate refund to you to the wallet you used for payment.",
  },
  {
    question: "Is this partnership with ACER official ?",
    answer:
      "Coincart is an official ACER partner: https://x.com/AcerFrance/status/1930630993955721480",
  },
  {
    question: "Why no locker delivery ?",
    answer: "We are working on it. Locker delivery is not available yet.",
  },
  {
    question: "The product is malfunctionning, what do i do ?",
    answer:
      "1. You can find the order ID on the tracking emails, and the SNID product reference on the product. You need both. 2. Contact us using the contact form, mentioning those, as well as the mail you used for the order so we can identify you.",
  },
];

export default function FaqPage() {
  return (
    <div>
      {/* Page Hero */}
      <div className="page-hero">
        <div className="container" style={{ textAlign: "center" }}>
          <h1 className="page-title" style={{ marginBottom: 16 }}>
            Frequently Asked Questions
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "1.05rem",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Everything you need to know about ordering, shipping, payment, and
            support at Coincart.
          </p>
        </div>
      </div>

      <div className="container-sm" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <AnimatedGroup preset="blur-slide" style={{ display: "flex", flexDirection: "column", gap: 16 }}
          variants={{ container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } } }}>
          {faqItems.map((item, index) => (
            <div className="surface" key={index}>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1.4,
                }}
              >
                {item.question}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "var(--muted)",
                  lineHeight: 1.65,
                }}
              >
                {item.answer}
              </p>
            </div>
          ))}
        </AnimatedGroup>

        {/* CTA Bar */}
        <div
          style={{
            marginTop: 40,
            padding: "32px 24px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <h3 style={{ marginBottom: 8 }}>Still have questions?</h3>
          <p className="small" style={{ marginBottom: 20, color: "var(--muted)" }}>
            Our support team is available Monday–Friday, 9:00–18:00 CET and
            responds within 24 hours.
          </p>
          <Link className="btn btn-teal" href="/contact-us">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
