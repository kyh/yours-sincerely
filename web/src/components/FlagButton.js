import { useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import { MoreVertical } from "react-feather";
import { lightTheme } from "util/theme";
import { Modal } from "components/Modal";
import { flagPost } from "actions/post";
import { blockUser } from "actions/user";

export const FlagButton = ({ post }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <IconContainer onClick={() => setIsOpen(true)}>
        <MoreVertical color={lightTheme.colors.grey} />
      </IconContainer>
      <Modal
        open={isOpen}
        onRequestClose={() => setIsOpen(false)}
        maxWidth={400}
        closeButton
      >
        <ModalContent>
          <ModalButton
            as="a"
            href={`mailto:kai@kyh.io?subject=Report YS Post: ${post.id}`}
          >
            Report...
          </ModalButton>
          <ModalButton
            type="button"
            onClick={() => {
              flagPost(post.id);
              router.push("/");
            }}
          >
            Mark as inappropriate
          </ModalButton>
          <ModalButton
            type="button"
            onClick={() => {
              blockUser(post.createdBy);
              router.push("/");
            }}
          >
            Stop seeing content from this user
          </ModalButton>
        </ModalContent>
      </Modal>
    </div>
  );
};

export const IconContainer = styled.button`
  width: ${({ theme }) => theme.spacings(8)};
  height: ${({ theme }) => theme.spacings(8)};
  border-radius: 100%;
  transition: 0.2s ease;
  &:hover {
    background-color: ${({ theme }) => theme.ui.border};
  }
`;

const ModalContent = styled.section`
  padding: ${({ theme }) =>
    `${theme.spacings(10)} ${theme.spacings(5)} ${theme.spacings(5)}`};
`;

const ModalButton = styled.button`
  text-align: center;
  display: block;
  width: 100%;
  padding: ${({ theme }) => theme.spacings(5)};
  border-bottom: 1px solid ${({ theme }) => theme.ui.border};
  line-height: 1.6;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.ui.background};
  }

  &:last-child {
    border-bottom: none;
  }
`;
