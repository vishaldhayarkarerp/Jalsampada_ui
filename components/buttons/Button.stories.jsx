import React from "react";
import Button from "./Button"; 

export default {
  title: "Components/button",
  component: Button,  
  tags: ['autodocs'],
  parameters: {
      layout: 'centered',
    },
  
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["button", "icon", "link-button"],
      description: "Regular button or icon button",
    },
    type: {
      control: { type: "select" },
      options: [
        "primary-button", 
        "primary-outlined-button",
        "secondary-button", 
        "ghost-primary-button", 
        "ghost-black-button",
        "danger-button", 
        "link-primary", 
        "link-black",
      ],
      description: "Button style (color and appearance)",
    },
    size: {
      control: { type: "select" },
      options: [
        "button-xsmall", "button-small", "button-medium", "button-large", "button-xlarge","link-size",
        "button-icon-xsmall","button-icon-small", "button-icon-medium", "button-icon-large",
        "button-icon-xlarge", "button-icon-xxlarge"
      ],
      description: "Button size",
    },
    iconSrc: {
      control: "text",
      description: "Path to the icon (for icon buttons only)",
    },
    children: {
      control: "text",
      description: "Button text (ignored for icon buttons)",
      defaultValue: "Button Text",
    },
  },
};

// ✅ Default Button Example
export const Default = (args) => <Button {...args} />;
Default.args = {
  variant: "button",
  type: "primary-button",
  size: "button-medium",
  children:"Button Text"
};

// ✅ Icon Button Example
export const IconButton = (args) => <Button {...args} />;
IconButton.args = {
  variant: "icon",
  type: "primary-button",
  size: "button-icon-large",
  iconSrc: "https://www.svgrepo.com/show/505250/plus.svg",
};

export const LinkButton = (args) => <Button {...args} />;
LinkButton.args = {
  variant: "link-button",
  type: "link-primary",
  size: "link-size",
  children:"Button Text"
};
