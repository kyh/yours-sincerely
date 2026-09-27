import { NotFoundContent } from "@/components/layout/not-found-content";

/** `notFound()` from a page under (app) renders inside the (app) layout, which
    already draws the chrome; the root not-found page draws its own for URLs that
    match no route, so reusing it here would render the chrome twice. */
const Page = () => <NotFoundContent />;

export default Page;
