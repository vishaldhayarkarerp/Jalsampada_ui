import React from "react";

import DateRangePicker from "./DateRangePicker";

export default {
  title: "Components/DateRangePicker",
  component: DateRangePicker,

  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {},
};

const Template = (args) => {
  return <DateRangePicker />;
};

export const Default = Template.bind({});
Default.args = {};
