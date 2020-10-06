import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { Modal } from "components/Modal";
import { Icon } from "components/Icon";
import { flagPost } from "features/posts/actions/postActions";
import { blockUser } from "features/posts/actions/blockActions";

export const FlagButton = ({ postId, post }) => {
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <IconContainer onClick={() => setIsOpen(true)}>
        <Icon icon="more" color="grey" />
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
            href={`mailto:im.kaiyu@gmail.com?subject=Report Post: ${postId}`}
          >
            Report...
          </ModalButton>
          <ModalButton
            type="button"
            onClick={() => {
              flagPost(postId);
              history.push("/");
            }}
          >
            Mark as inappropriate
          </ModalButton>
          <ModalButton
            type="button"
            onClick={() => {
              blockUser(post.createdBy);
              history.push("/");
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
