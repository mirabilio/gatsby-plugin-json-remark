const state = {
  ["/dir/file1.json"]: {
    DirJson: {
      content1Html: {
        type: "String",
        resolver: () => {},
      },
      content2Html: {
        type: "String",
        resolver: () => {},
      },
    },
    DirJsonSomeObject: {
      content1Html: {
        type: "String",
        resolver: () => {},
      },
    },
    DirJsonSomeObjectSomeObject: {
      content1Html: {
        type: "String",
        resolver: () => {},
      },
    },
    DirJsonSomeObjectSomeArrayOfObjects: {
      content1Html: {
        type: "String",
        resolver: () => {},
      },
      content2Html: {
        type: "String",
        resolver: () => {},
      },
      content3Html: {
        type: "String",
        resolver: () => {},
      },
    },
  },
  idsByAbsolutePath: {
    ["/dir/file1.json"]: {
      ["dirJson.content1Html"]: "1",
      ["dirJson.content2Html"]: "2",
      ["dirJson.someObject.content1Html"]: "3",
      ["dirJson.someObject.someObject.content1Html"]: "4",
      ["dirJson.someObject.someArrayOfObjects.0.content1Html"]: "5",
      ["dirJson.someObject.someArrayOfObjects.0.content2Html"]: "6",
      ["dirJson.someObject.someArrayOfObjects.0.content3Html"]: "7",
      ["dirJson.someObject.someArrayOfObjects.1.content1Html"]: "8",
      ["dirJson.someObject.someArrayOfObjects.1.content2Html"]: "9",
    },
  },
};
exports.state = state;
