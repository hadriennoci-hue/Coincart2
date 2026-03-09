export const runtime = 'edge';

const faqItems = [
  {
    question: "What informations are required to complete my order ?",
    answer:
      "<p>Coincart only needs shipping informations: shipping address, contact name, phone and email for tracking.</p>",
  },
  {
    question: "What cryptocurrencies do you accept ?",
    answer:
      "<p>We accept: USDC, USDT, BTC, XMR, ZEC, SOL, ETH. Our payment processor is BTCPay Server.</p>",
  },
  {
    question: "How does the warranty work ?",
    answer:
      "<p>Laptops, Desktops, monitors, GPUs are under two years constructor warranty (see product specifications). If you need to activate warranty, you will have to contact Coincart support with Serial Number + proof (photo), and then send the product back to ACER. We will connect you with the proper ACER support.</p>",
  },
  {
    question: "Why is shipping more costly for non local keyboards ?",
    answer:
      "<p>For example, lets say you want to ship a german QWERTZ laptop to a french adress. Coincart needs to comply with ACER / EU VAT rules, which means we need to ship the laptop first to Germany, then reship it to France. Shipping is therefore more expensive and takes longer.</p><p>When ordering a non local keyboard, please make sure you pick the non -local shipping option at checkout.</p><p>Please note that Switzerland and United Kingdom can only ship local keyboards because they are not part of EU.</p>",
  },
  {
    question: "What countries are currently covered ?",
    answer:
      "<p>We cover Europe.<br /><br />For large orders superior to 20K$ to other continents: send DM describing your order &amp; shipping destination.</p>",
  },
  {
    question: "How can I contact Coincart customer support ?",
    answer:
      "<p>Our customer service team is available to assist you via the <a href=\"https://coincart.store/contact-us\">contact form</a> or via telegram. We will respond to all inquiries within 24 hours.</p>",
  },
  {
    question: "What is the return policy?",
    answer:
      "<p>If you change your mind, you have 15 days to return the product in its original packaging. Shipping fees will not be refunded by Coincart.</p><p>Please use the contact form, and provide the email you used for purchase as well as product serial number and proof (photo). We will provide you with ACER Support contact, which will ask about Product Serial Number, and will give you shipping information (Poland). Upon reception and inspection of the product by ACER STORE, Coincart will initiate refund to you to the wallet you used for payment.</p>",
  },
  {
    question: "Is this partnership with ACER official ?",
    answer:
      "<p>Coincart is an official ACER partner:<br />https://x.com/AcerFrance/status/1930630993955721480</p>",
  },
  {
    question: "Why no locker delivery ?",
    answer: "<p>We are working on it. Locker delivery is not available yet.</p>",
  },
  {
    question: "The product is malfunctionning, what do i do ?",
    answer:
      "<p>1. You can find the order ID on the tracking emails, and the SNID product reference on the product. You need both.<br />2. Contact us using the contact form, mentioning those, as well as the mail you used for the order so we can identify you.</p>",
  },
];

export default function FaqPage() {
  return (
    <div className="card">
      <h2>Frequently Asked Questions</h2>
      <div style={{ display: "grid", gap: 16 }}>
        {faqItems.map((item) => (
          <section key={item.question} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>{item.question}</h3>
            <div dangerouslySetInnerHTML={{ __html: item.answer }} />
          </section>
        ))}
      </div>
    </div>
  );
}

