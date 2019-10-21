import React from "react";
import { IconProps, IconWrapper } from "../constants/IconConstants";
import { ReactComponent as DeleteIcon } from "../assets/icons/control/delete.svg";
import { ReactComponent as MoveIcon } from "../assets/icons/control/move.svg";
import { ReactComponent as EditIcon } from "../assets/icons/control/edit.svg";

/* eslint-disable react/display-name */

export const ControlIcons: {
  [id: string]: Function;
} = {
  DELETE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <DeleteIcon />
    </IconWrapper>
  ),
  MOVE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <MoveIcon />
    </IconWrapper>
  ),
  EDIT_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <EditIcon />
    </IconWrapper>
  ),
};
