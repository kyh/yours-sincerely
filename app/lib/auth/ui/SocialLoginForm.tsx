import { Form, useFormAction } from "remix";

export const SocialLoginForm = () => (
  <Form className="flex justify-center" action="/auth/login" method="post">
    <button className="z-10" formAction={useFormAction("/auth/google")}>
      <img
        src="/assets/google-button.svg"
        alt="Sign in with Google"
        width={195}
        height={50}
      />
    </button>
  </Form>
);
