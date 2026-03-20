export const WEB_PRACTICE_TYPES = ["HTML", "CSS", "REACT"];

export const WEB_PRACTICE_PROBLEMS = [
  {
    id: "welcome-page",
    title: "Welcome Page",
    type: "HTML",
    difficulty: "EASY",
    instructions: [
      "Create a complete HTML document structure:",
      "- <!DOCTYPE html>, <html>, <head>, <body>",
      "",
      'Add a <title> inside <head> with the text: "Welcome".',
      "",
      'Inside <body>, add an <h1> tag with the text: "Welcome to DKCode Arena".',
      "",
      "Below the heading, add a <p> tag with a short description about learning web development.",
      "",
      "Use proper indentation and clean formatting.",
    ].join("\n"),
    criteria: [
      { id: "doctype", label: "Has <!DOCTYPE html> and valid structure" },
      { id: "title", label: 'Has <title>Welcome</title>' },
      { id: "h1", label: 'Has <h1>Welcome to DKCode Arena</h1>' },
      { id: "p", label: "Has a <p> description under the heading" },
    ],
    starter: {
      html: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Welcome</title>\n</head>\n<body>\n\n</body>\n</html>\n",
      css: "",
      js: "",
    },
  },
  {
    id: "simple-profile",
    title: "Creating a Simple Profile Page",
    type: "HTML",
    difficulty: "EASY",
    instructions: [
      "Build a personal profile page with:",
      "- A main heading (your name) using <h1>",
      "- A profile image using <img> (use any public image URL)",
      "- An unordered list <ul> with 3 hobbies",
      "- A link <a> to your favorite website",
    ].join("\n"),
    criteria: [
      { id: "h1", label: "Has an <h1> name" },
      { id: "img", label: "Has an <img> with src" },
      { id: "ul", label: "Has a <ul> with at least 3 <li>" },
      { id: "a", label: "Has an <a> link with href" },
    ],
    starter: {
      html: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Profile</title>\n</head>\n<body>\n\n</body>\n</html>\n",
      css: "",
      js: "",
    },
  },
  {
    id: "grocery-list",
    title: "Grocery Shopping List",
    type: "HTML",
    difficulty: "EASY",
    instructions: [
      "Create a grocery list using HTML lists.",
      "",
      "Requirements:",
      "- A heading <h1> Grocery Shopping List",
      "- An ordered list <ol> with at least 5 items",
      "- Mark at least one item as important using <strong> or <em>",
    ].join("\n"),
    criteria: [
      { id: "h1", label: "Has <h1> Grocery Shopping List" },
      { id: "ol", label: "Has an <ol> with at least 5 items" },
      { id: "em", label: "Uses <strong> or <em> on at least one item" },
    ],
    starter: {
      html: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Grocery List</title>\n</head>\n<body>\n\n</body>\n</html>\n",
      css: "",
      js: "",
    },
  },
  {
    id: "contact-form",
    title: "Contact Form Basics",
    type: "HTML",
    difficulty: "EASY",
    instructions: [
      "Create a basic contact form structure.",
      "",
      "Requirements:",
      "- A <form>",
      "- Name input (type=text)",
      "- Email input (type=email)",
      "- Message textarea",
      "- Submit button",
    ].join("\n"),
    criteria: [
      { id: "form", label: "Has a <form>" },
      { id: "name", label: "Has name input type=text" },
      { id: "email", label: "Has email input type=email" },
      { id: "textarea", label: "Has a textarea for message" },
      { id: "button", label: "Has a submit button" },
    ],
    starter: {
      html: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Contact</title>\n</head>\n<body>\n\n</body>\n</html>\n",
      css: "",
      js: "",
    },
  },
];

export function getWebPracticeProblem(problemId) {
  return WEB_PRACTICE_PROBLEMS.find((p) => p.id === problemId) || null;
}

