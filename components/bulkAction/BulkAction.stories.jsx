import BulkAction from "./BulkAction";

export default {
  title: "Components/BulkAction",
  component: BulkAction,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    number: {
      control: "text",
      description: "Amount",
      defaultValue: "2",
    },
    rounded: {
      control: "boolean", // Ensure it's a boolean, not a string
      description: "Rounded corners",
      defaultValue: false, // Use `false` instead of `"false"`
    },
  }
}

const Template = (args) => <BulkAction {...args} />

export const Card = Template.bind({});

Card.args = {
  number: "2",
  rounded: false, // Pass as boolean, not string
}