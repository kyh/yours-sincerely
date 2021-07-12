import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import ReactModal from "react-modal";
import { X } from "react-feather";

const ModalStyle = createGlobalStyle`
  .modal {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 40px;
    left: 20px;
    right: 20px;
    max-width: 600px;
    border-radius: 10px;
    background: ${({ theme }) => theme.ui.modal.background};
    outline: none;
    margin: 0 auto;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(59, 71, 95, 0.85);
  }
`;

export const Modal = ({
  children,
  open,
  closeButton,
  title,
  onRequestClose,
  maxWidth,
}) => {
  return (
    <>
      <ModalStyle />
      <ReactModal
        isOpen={open}
        onRequestClose={onRequestClose}
        className="modal"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
        style={{
          content: {
            maxWidth: maxWidth,
          },
        }}
      >
        {closeButton && (
          <CloseButton onClick={onRequestClose}>
            <X />
          </CloseButton>
        )}
        {title && <ModalHeader>{title}</ModalHeader>}
        <ModalBody>{children}</ModalBody>
      </ReactModal>
    </>
  );
};

const CloseButton = styled.button`
  width: 45px;
  height: 45px;
  position: absolute;
  top: 4px;
  right: 4px;
  border-radius: 100%;
  transition: 0.2s ease;
  &:hover {
    background-color: ${({ theme }) => theme.ui.border};
  }
`;

const ModalHeader = styled.header`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.h3.fontSize};
  font-weight: 600;
  padding: ${({ theme }) => `${theme.spacings(9)} 0 ${theme.spacings(5)}`};
`;

const ModalBody = styled.section`
  height: 100%;
  overflow: auto;
  -webkit-overflow-scroll: touch;
`;
