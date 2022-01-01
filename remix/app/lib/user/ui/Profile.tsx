import { Form, useLoaderData } from "remix";
import { User } from "~/lib/user/data/userSchema";
import { isIOS } from "~/lib/core/util/platform";

type LoaderData = {
  user: User | null;
};

export const Profile = () => {
  const { user } = useLoaderData<LoaderData>();
  console.log(user);
  return (
    <section className="sm:flex">
      <img
        className="m-auto sm:w-1/2"
        src="/assets/dancing.svg"
        alt="Not logged in"
        width={300}
        height={225}
      />
      <div className="sm:w-1/2">
        <Form action="/auth/logout" method="post">
          <button type="submit">Logout</button>
        </Form>
      </div>
    </section>
  );
};

// import { useState } from "react";
// import styled from "styled-components";
// import { Input } from "components/Input";
// import { Spinner } from "components/Spinner";
// import { ProfileDetails } from "components/ProfileDetails";
// import { useAuth } from "actions/auth";
// import { isIOS } from "util/platform";

// export const Profile = () => {
//   const router = useRouter();
//   const { user, updateProfile, signout } = useAuth();
//   const [isLoading, setIsLoading] = useState(false);

//   const changeName = async (event) => {
//     event.preventDefault();
//     const name = event.target.value;
//     if (name) {
//       setIsLoading(true);
//       await updateProfile({ displayName: name });
//       setIsLoading(false);
//     }
//   };

//   const logout = async () => {
//     await signout();
//     router.push(`/`);
//   };

//   return (
//     <ProfileDetails>
//       <Image
//         src="/assets/dancing.svg"
//         alt="Logged in"
//         width={300}
//         height={225}
//       />
//       <ProfileForm>
//         <InputContainer>
//           <NameInput
//             type="text"
//             id="name"
//             name="name"
//             placeholder="Bojack the horse"
//             disabled={isLoading}
//             defaultValue={user.displayName}
//             onBlur={changeName}
//             required
//           />
//           <InputSpinner loading={isLoading} />
//         </InputContainer>
//         {!isIOS() && (
//           <button
//             type="button"
//             className="logout"
//             disabled={isLoading}
//             onClick={logout}
//           >
//             Log out
//           </button>
//         )}
//       </ProfileForm>
//     </ProfileDetails>
//   );
// };

// const InputContainer = styled.div`
//   position: relative;
// `;

// const InputSpinner = styled(Spinner)`
//   position: absolute;
//   right: 0;
//   top: 50%;
//   transform: translateY(-50%);
// `;

// const NameInput = styled(Input)`
//   font-size: 2rem;
//   font-weight: 600;
//   max-width: 100%;
// `;

// const ProfileForm = styled.form`
//   width: 100%;
//   display: flex;
//   flex-direction: column;

//   .submit {
//     margin-top: ${({ theme }) => theme.spacings(3)};
//   }
//   .logout {
//     display: inline-block;
//     margin: auto auto 0;
//     color: ${({ theme }) => theme.colors.red};
//     padding: ${({ theme }) => `${theme.spacings(3)} ${theme.spacings(6)}`};
//     border-radius: 4px;
//     transition: background 0.23s ease;
//     &:hover {
//       background: ${({ theme }) => theme.colors.backgroundRed};
//     }
//     ${({ theme }) => theme.breakpoints.sm`
//       margin: ${({ theme }) => theme.spacings(10)} auto;
//     `}
//   }
// `;
