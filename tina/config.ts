import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_PUBLIC_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "static",
    },
  },
  schema: {
    collections: [
      {
        name: "post",
        label: "Posts",
        path: "content/posts",
        format: 'md',
        defaultItem: () => {
          return {
            author: 'Aiden Vaines',
          }
        },
        ui: {
          filename: {
            slugify: (values) => {
              const postDate = values.date ? new Date(values.date) : new Date();
              return `${postDate.toISOString().split("T")[0]}-${values?.title
                ?.toLowerCase()
                .replace(/ /g, '-')}`
            },
          },
        },
        fields: [
          {
            name: 'draft',
            label: 'Draft',
            type: 'boolean',
            required: true,
            description: 'If this is checked the post will not be published',
          },
          {
            name: "title",
            label: "Title",
            type: "string",
            isTitle: true,
            required: true,
          },
          {
            name: "author",
            label: "Author",
            type: "string",
          },
          {
            name: 'image',
            label: 'Hero image',
            type: 'image',
          },
          {
            name: 'featured',
            type: 'boolean',
            label: 'Featured'
          },
          {
            name: "tags",
            label: "Tags",
            type: "string",
            list: true
          },
          {
            label: "Date",
            name: "date",
            type: "datetime"
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
    ],
  },
  search: {
    tina: {
      indexerToken: process.env.TINA_SEARCH_TOKEN,
      stopwordLanguages: ['eng'],
    },
    indexBatchSize: 100,
    maxSearchIndexFieldLength: 100,
  },
});
