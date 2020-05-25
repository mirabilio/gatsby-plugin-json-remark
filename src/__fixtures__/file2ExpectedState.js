const state = {
  ["/dir/file2.json"]: {
    DirJson: {
      content1Html: {
        type: "String",
        resolve: () => {},
      },
      content3Html: {
        type: "String",
        resolve: () => {},
      },
    },
    DirJsonSomeObject: {
      content2Html: {
        type: "String",
        resolve: () => {},
      },
    },
    DirJsonSomeObjectSomeObject: {
      content1Html: {
        type: "String",
        resolve: () => {},
      },
      content3Html: {
        type: "String",
        resolve: () => {},
      },
    },
    DirJsonSomeObjectSomeArrayOfObjects: {
      content1Html: {
        type: "String",
        resolver: () => {},
      },
      content3Html: {
        type: "String",
        resolver: () => {},
      },
      content2Html: {
        type: "String",
        resolver: () => {},
      },
      content4Html: {
        type: "String",
        resolver: () => {},
      },
    },
  },
  idsByAbsolutePath: {
    ["/dir/file2.json"]: {
      ["dirJson.content1Html"]: "11",
      ["dirJson.content3Html"]: "12",
      ["dirJson.someObject.content2Html"]: "13",
      ["dirJson.someObject.someObject.content1Html"]: "14",
      ["dirJson.someObject.someObject.content3Html"]: "15",
      ["dirJson.someObject.someArrayOfObjects.0.content1Html"]: "16",
      ["dirJson.someObject.someArrayOfObjects.0.content3Html"]: "17",
      ["dirJson.someObject.someArrayOfObjects.1.content2Html"]: "18",
      ["dirJson.someObject.someArrayOfObjects.1.content4Html"]: "19",
    },
  },
};
exports.state = state;
