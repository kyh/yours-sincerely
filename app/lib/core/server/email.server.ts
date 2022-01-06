import { Client } from "postmark";

const API_TOKEN = process.env.POSTMARK_API_TOKEN || "fake";

const client = new Client(API_TOKEN);

type SendEmailInput = {
  from?: string;
  to: string;
  templateAlias: string;
  templateModel: object;
};

const defaultModel = {
  product_url: "https://yourssincerely.org",
  product_name: "Yours Sincerely",
  support_url: "kai@kyh.io",
  company_name: "Kyh LLC",
};

export const sendEmail = (input: SendEmailInput) => {
  const templateModel = {
    ...defaultModel,
    ...input.templateModel,
  };

  if (process.env.NODE_ENV === `development`) {
    console.info(`Not sending email in development:`);
    console.log();
    console.log(`From: ${input.from || "support@yourssincerely.org"}`);
    console.log(`To: ${input.to}`);
    console.log(`Template:`);
    console.log(templateModel);
    console.log();
    return;
  }

  return client.sendEmailWithTemplate({
    From: input.from || "support@yourssincerely.org",
    To: input.to,
    TemplateAlias: input.templateAlias,
    TemplateModel: templateModel,
  });
};
