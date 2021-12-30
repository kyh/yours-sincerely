import { Link } from "remix";
import { addDays, format } from "date-fns";
import { Post, POST_EXPIRY_DAYS_AGO } from "~/lib/post/data/postSchema";

const postKey = "ys-post";

export const storePost = (post: Post) => {
  const postString = JSON.stringify(post);
  localStorage.setItem(postKey, postString);
};

export const getStoredPostAndClear = () => {
  const postString = localStorage.getItem(postKey) || "{}";
  localStorage.removeItem(postKey);
  return JSON.parse(postString) as Post;
};

type Props = {
  postingAs?: string;
  post?: Post;
  isSubmitting: boolean;
  onSubmit: (post: Post) => void;
};

export const PostForm = ({
  postingAs,
  post,
  onSubmit,
  isSubmitting,
}: Props) => {
  const expiry = addDays(new Date(), POST_EXPIRY_DAYS_AGO);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const input = Object.fromEntries(data.entries()) as Post;
    storePost(input);
    onSubmit(input);
  };

  return (
    <form className="relative" onSubmit={handleSubmit}>
      <textarea
        className="w-full h-full pt-6 pb-20 resize-none border-none outline-none text-lg"
        name="content"
        defaultValue={post ? post.content : ""}
        placeholder="Hello in there?"
        onBlur={(e) => storePost({ content: e.target.value })}
        autoFocus
        required
      />
      <footer className="absolute bottom-5 left-0 right-0 flex justify-between items-center">
        <div className="text-sm">
          <span className="block mb-2">
            {postingAs ? (
              <>
                Publishing as:{" "}
                <Link className="" to="/profile">
                  {postingAs}
                </Link>
              </>
            ) : (
              "Publishing anonymously"
            )}
          </span>
          <span className="block">
            This post will expire on {format(expiry, "MMMM do")}
          </span>
        </div>
        <button type="submit" disabled={isSubmitting}>
          Publish
        </button>
      </footer>
    </form>
  );
};

// const Form = styled.form`
//   position: relative;
// `;

// const Textarea = styled.textarea`
//   width: 100%;
//   height: 100%;
//   border: none;
//   resize: none;
//   outline: none;
//   padding: ${({ theme }) => theme.spacings(6)} 0 80px;
//   font-size: ${({ theme }) => theme.typography.post.fontSize};
//   line-height: ${({ theme }) => theme.typography.post.lineHeight};
// `;

// const SubmitContainer = styled.section`
//   position: absolute;
//   bottom: 20px;
//   left: 0;
//   right: 0;
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
// `;

// const PostDetails = styled.div`
//   span {
//     display: block;
//     font-size: 0.8rem;
//   }
//   .posting-as {
//     margin-bottom: ${({ theme }) => theme.spacings(2)};

//     a {
//       text-decoration: underline;
//       text-decoration-style: dotted;
//     }
//   }
//   .expiry {
//     color: #919294;
//   }
// `;
