import { Form } from "remix";

export const SocialLoginForm = () => (
  <Form className="flex justify-center" action="/auth/google" method="post">
    <button type="submit">
      <img
        src="/assets/google-button.svg"
        alt="Sign in with Google"
        width={195}
        height={50}
      />
    </button>
  </Form>
);
