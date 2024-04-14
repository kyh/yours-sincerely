import Image from "next/image";
import Link from "next/link";
import { Divider } from "@/app/_components/divider";
import { SocialLoginForm } from "@/lib/auth/ui/socialloginform";

export const NoProfile = () => {
  return (
    <>
      <section className="sm:flex">
        <Image
          className="m-auto sm:w-1/2"
          src="/assets/dancing.svg"
          alt="Not logged in"
          width={300}
          height={225}
        />
        <div className="sm:w-1/2">
          <h1 className="my-5 text-3xl font-bold">
            You’re not signed in...
          </h1>
          <p>
            But, you can still <Link href="/posts/new" className="text-[#8389E1]">make a post</Link>{" "}
            anonymously without an account
          </p>
        </div>
      </section>

      <div>
        <Divider>Or continue with</Divider>
        <SocialLoginForm withEmail />
      </div>
    </>
  );
};
