import Tags from "./Tags";

export default{
    title:"Components/Tags",
    component:Tags,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
      },
      argTypes: {
        variant: {
          control: { type: "select" },
          options: [  "tag", "buttons", ],
          description: "Button or tag", 
        },
        type: {
            control: { type: "select" },
            options: [
              "primary", "danger", "success", "warning", "secondary", "secondaryDark", "yellow", "indigo", 
              "teal", "pink", "cyan"
            ],
            description: "Button style (color and appearance)",
          },
          tagText: {
            control: "text",
            description: "Tag text",
            defaultValue: "Lable",
          },
          border: {
            control: {type:"boolean"},
            description: "Border",
            defaultValue: false,
          },

    }

}   
const Template = (args) => <Tags {...args} />

export const Card = Template.bind({});

Card.args = {
  variant:"tag", type:'primary',tagText:"Lable", border: false
}