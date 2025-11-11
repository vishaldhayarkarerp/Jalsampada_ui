import React, { useState } from "react";
import TableUtilToggle from "./TableUtilToggle";

export default TableUtilToggle = {
  title: "Components/TableUtilToggle", // Grouping in Storybook
  component: TableUtilToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    checked: { control: "boolean" },
  },
};

const Template = (args) => {
  const [checked, setChecked] = useState(args.checked || false);

  return <TableUtilToggle {...args} inputProps={{ checked, setChecked }} />;
};

export const Default = Template.bind({});
Default.args = {
  label: "Label 12",
  checked: false,
};
