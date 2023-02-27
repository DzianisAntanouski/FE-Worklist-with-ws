sap.ui.define(
    [
        "sap/m/Dialog",
        "sap/m/Button",
        "sap/m/FlexBox",
        "sap/m/Input",
        "sap/m/Label",
        "sap/m/Select",
        "sap/m/TextArea",
        "sap/ui/unified/FileUploader",
    ],
    function (Dialog, Button, FlexBox, Input, Label, Select, TextArea, FileUploader) {
        "use strict";
        return {
            _oDialog: null,

            onPressCreate: function () {
                if (!this._oDialog) {
                    this._oDialog = new Dialog({
                        title: "Create Item",
                        content: [
                            new FlexBox({
                                justifyContent: "SpaceBetween",
                                alignItems: "Start",
                                items: [new Label({ text: "Name" }), new Input({ value: "{/Name}" })],
                            }),
                            new FlexBox({
                                justifyContent: "SpaceBetween",
                                alignItems: "Start",
                                items: [
                                    new Label({ text: "Type" }),
                                    new Select({
                                        selectedKey: "{/Type}",
                                        items: [
                                            new sap.ui.core.Item({ text: "Text", key: "text" }),
                                            new sap.ui.core.Item({ text: "URL", key: "url" }),
                                            new sap.ui.core.Item({ text: "File", key: "file" }),
                                        ],
                                    }),
                                ],
                            }),
                            new FlexBox({
                                justifyContent: "SpaceBetween",
                                alignItems: "Start",
                                items: [
                                    new Label({ text: "Value" }),
                                    new Input({ value: "{/Value}", visible: "{= ${/Type} === 'url' }" }),
                                    new TextArea({ value: "{/Value}", visible: "{= ${/Type} === 'text' }", width: "100%" }),

                                    new FileUploader({
                                        name: "myFile",
                                        additionalData: "{/Type}",
                                        visible: "{= ${/Type} === 'file' }",
                                        //!! -----------http://localhost:4004/cap/upload
                                        uploadUrl: "http://localhost:4004/cap/upload",
                                        change: function (oEvent) {
                                            console.log("File selected");
                                        },
                                    }),
                                ],
                            }),
                        ],
                        beginButton: new Button({
                            text: "Save",
                            press: this.onPressSave.bind(this),
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            press: this.onPressCancel.bind(this),
                        }),
                        afterClose: this.onCloseDialog.bind(this),
                    });

                    this.getView().addDependent(this._oDialog);
                }

                // Set default values
                var oModel = new sap.ui.model.json.JSONModel({
                    Name: "",
                    Type: "text",
                    Value: "",
                });
                this._oDialog.setModel(oModel);

                this._oDialog.open();
            },

            onPressSave: async function (oEvent) {
                var oData = this._oDialog.getModel().getData();
                var oProp = {
                    Name: `${oData.Name}`,
                    Description: "bla-bla",
                    URI: "wait crating from " + oData.Type,
                    Date: `${new Date()}`,
                    Status: "process",
                };

                switch (oData.Type) {
                    case "text":
                        this.getView().getModel().create("/upload", {
                            Type: oData.Type,
                            Value: oData.Value,
                        });

                        break;
                    case "url":
                        this.getView().getModel().create("/upload", {
                            Type: oData.Type,
                            Value: oData.Value,
                        });
                        break;
                    case "file":
                        if (this._oDialog.getContent()[2].getItems()[3].checkFileReadable() && oData.Name) {
                            this._oDialog.getContent()[2].getItems()[3].upload();
                        }
                        break;
                    default:
                        break;
                }

                //! ---------------- ws://localhost:4004/
                const oSocket = new WebSocket("ws://localhost:4004/");

                var that = this;

                oSocket.onopen = () => {
                    console.log("socket opened");
                };

                // Create table item
                this.getView()
                    .getModel()
                    .create("/Models", oProp, {
                        success: async (a, b) => {
                            this.getView().getModel().refresh();

                            oSocket.onmessage = (oEvent) => {
                                var oData = JSON.parse(oEvent.data)
                                that.getView().getModel().update(`/Models(${oData.id})`, { Status: "ready", URI: oData.url }, { success: () => {
                                    this.getView().getModel().refresh();
                                } })
                            };

                            oSocket.send(a.ID);
                        },
                        error: (e) => {
                            console.error(e);
                        },
                    });

                this._oDialog.close();
            },

            onPressCancel: function () {
                this._oDialog.close();
            },

            onCloseDialog: function () {
                this._oDialog.destroy();
                this._oDialog = null;
            }
        };
    }
);
