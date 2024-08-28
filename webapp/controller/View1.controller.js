sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
],
    function (Controller, JSONModel, MessageToast) {
        "use strict";

        return Controller.extend("com.kpo.supplierreport.controller.View1", {
            onInit: function () {

                let oGoodsWorkServicePurchaseModel = new JSONModel([]);
                this.getView().setModel(oGoodsWorkServicePurchaseModel, "oGoodsWorkServicePurchaseModel")
                this.fetchDataFromODataService();

            },
            onAddRow: function () {
                var oModel = this.getView().getModel("oGoodsWorkServicePurchaseModel");
                let oModelData = oModel.getData();
                oModelData.push({

                    purchaseCode: "",
                    purchaseMethod: "",
                    contractNumber: "",
                    contractSubject: "",
                    contractAwardDate: "",
                    contractExpireDate: "",
                    totalContractValueWOVAT: 0.0,
                    legalEntity: "",
                    country: "",
                    supplierName: "",
                    BIN: "",
                    supplierAddress: "",
                    GWSCode: "",
                    nameOfGoodWorkService: "",
                    UOM: "",
                    procurementScope: "",
                    actualAmountExVat: 0.0,
                    registrationNumber: "",
                    localGoodsManufacturerBin: "",
                    CT_KZ_Cert_Num: "",
                    dateOfCertIssue: "",
                    localContentInGoodsPercentage: 0.0,
                    localContentInWorkPercentage: 0.0
                })

                oModel.setData(oModelData);
                oModel.refresh()

            },

            onSaveTable: function () {
                let OModel = this.getOwnerComponent().getModel();
                var oTable = this.byId("idGoodsWorkServicePurchaseTable");
                var oSelectedIndex = oTable.getSelectedIndex();
                var oModel = this.getView().getModel("oGoodsWorkServicePurchaseModel");
                
                if (oSelectedIndex === -1) {
                    MessageToast.show("Please select a row to save.");
                    return;
                }
            
                var aData = oModel.getData();
                var oSelectedData = aData[oSelectedIndex];
            
                var oEntry = {
                    purchaseCode: oSelectedData.purchaseCode,
                    purchaseMethod: oSelectedData.purchaseMethod,
                    contractNumber: oSelectedData.contractNumber,
                    contractSubject: oSelectedData.contractSubject,
                    contractAwardDate: oSelectedData.contractAwardDate,
                    contractExpireDate: oSelectedData.contractExpireDate,
                    totalContractValueWOVAT: oSelectedData.totalContractValueWOVAT,
                    legalEntity: oSelectedData.legalEntity,
                    country: oSelectedData.country,
                    supplierName: oSelectedData.supplierName,
                    BIN: oSelectedData.BIN,
                    supplierAddress: oSelectedData.supplierAddress,
                    GWSCode: oSelectedData.GWSCode,
                    nameOfGoodWorkService: oSelectedData.nameOfGoodWorkService,
                    UOM: oSelectedData.UOM,
                    procurementScope: oSelectedData.procurementScope,
                    actualAmountExVat: oSelectedData.actualAmountExVat,
                    registrationNumber: oSelectedData.registrationNumber,
                    localGoodsManufacturerBin: oSelectedData.localGoodsManufacturerBin,
                    CT_KZ_Cert_Num: oSelectedData.CT_KZ_Cert_Num,
                    dateOfCertIssue: oSelectedData.dateOfCertIssue,
                    localContentInGoodsPercentage: oSelectedData.localContentInGoodsPercentage,
                    localContentInWorkPercentage: oSelectedData.localContentInWorkPercentage
                };
            
                var that = this;
            
                if (oSelectedData.ID && oSelectedData.parentKey_ID) {
                    // Entry exists in the backend, perform update
                    var sPath = `/GoodsWorkServicePurchaseT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;
                    OModel.update(sPath, oEntry, {
                        success: function () {
                            // MessageToast.show("Line item updated successfully.");

                        },
                        error: function (oError) {
                            MessageToast.show("Error updating line item.");
                        }
                    });
                } else {
                    // Entry might be new, check if it's in-memory (not yet saved to backend)
                    if (oSelectedData.isNew) {
                        // Update existing in-memory data before sending it to backend
                        that._addLineItem(OModel, oSelectedData.parentKey_ID, oEntry);
                    } else {
                        // Check if header exists before creating a new entry
                        OModel.read("/LC_HeaderT", {
                            filters: [
                                new sap.ui.model.Filter("vendorID", sap.ui.model.FilterOperator.EQ, "VEN11"),
                                new sap.ui.model.Filter("contractNo", sap.ui.model.FilterOperator.EQ, "CON01")
                            ],
                            success: function (oData) {
                                if (oData.results && oData.results.length > 0) {
                                    var headerID = oData.results[0].ID; // Assume the header ID is stored in 'ID'
                                    that._addLineItem(OModel, headerID, oEntry);
                                } else {
                                    that._createNewHeader(OModel, oEntry);
                                }
                            },
                            error: function (oError) {
                                MessageToast.show("Error fetching header data from OData service.");
                            }
                        });
                    }
                }
            },
            
            _createNewHeader: function (OModel, oEntry) {
                var that = this;
                var headerEntry = {
                    gwsReport: [oEntry], // Initialize with the first line item
                    vendorID: "VEN11",
                    contractNo: "CON01",
                    reportingPeriod: "2024-08-08T00:00:00",
                    status: "Draft"
                };
            
                OModel.create("/LC_HeaderT", headerEntry, {
                    
                    success: function () {
                        // MessageToast.show("Header and first line item created successfully.");
                        that.fetchDataFromODataService();
                    },
                    error: function (oError) {
                        MessageToast.show("Error creating header in OData service.");
                    }
                });
            },
            
            _addLineItem: function (OModel, headerID, oEntry) {
                var that = this;
                // Construct path for adding line item to the existing header
                var path = `/LC_HeaderT('${headerID}')/gwsReport`;
                OModel.create(path, oEntry, {
                    success: function () {
                        // MessageToast.show("Line item added successfully.");
                        that.fetchDataFromODataService();
                    },
                    error: function (oError) {
                        MessageToast.show("Error adding line item to existing header.");
                    }
                });
            },
            
            fetchDataFromODataService: function () {
                let OModel = this.getOwnerComponent().getModel(); // Get the OData model
                let oJSONModel = this.getView().getModel("oGoodsWorkServicePurchaseModel"); // Get your JSON model

                OModel.read("/GoodsWorkServicePurchaseT", {
                    success: function (oData) {
                        // Assuming the response contains an array of records
                        oJSONModel.setData(oData.results);
                        console.log(oData.results)
                        oJSONModel.refresh();
                    },
                    error: function (oError) {
                        sap.m.MessageToast.show("Error fetching data from OData service.");
                    }
                });
            },


            onDeleteRow: function () {
                var that = this;
                var oTable = this.byId("idGoodsWorkServicePurchaseTable"); // Use the correct table ID
                var oModel = this.getOwnerComponent().getModel();
                var aSelectedIndices = oTable.getSelectedIndices();
            
                // Check if any item is selected
                if (aSelectedIndices.length > 0) {
                    var iSelectedIndex = aSelectedIndices[0];
                    var oContext = oTable.getContextByIndex(iSelectedIndex);
            
                    if (oContext) {
                        var oSelectedData = oContext.getObject(); // Get the selected data object
            
                        // Check if ID and parentKey_ID are present
                        if (oSelectedData.ID && oSelectedData.parentKey_ID) {
                            var sDeletePath = `/GoodsWorkServicePurchaseT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;
            
                            // Perform the delete operation
                            oModel.remove(sDeletePath, {
                                success: function () {
                                    MessageToast.show("Entry deleted successfully.");
                                    oTable.getBinding("rows").refresh(); // Refresh the table to reflect changes
                                    that.fetchDataFromODataService();
                                },
                                error: function (oError) {
                                    console.error(oError); // Log error details for debugging
                                    MessageToast.show("Error deleting entry.");
                                }
                            });
                        } else {
                            MessageToast.show("Selected entry does not have a valid ID and parentKey_ID.");
                        }
                    } else {
                        MessageToast.show("Selected context is invalid.");
                    }
                } else {
                    MessageToast.show("No item selected.");
                }
            },
            




            onDelete1: function () {
                let model = this.getView().getModel("firstTable");
                let table = this.byId("itemsTable1");
                let selectedIndices = table.getSelectedIndices();
                let modelData = model.getData();
                selectedIndices.sort((a, b) => b - a).forEach(index => {
                    modelData.splice(index, 1);
                });
                model.setData(modelData);
                model.refresh();
                table.clearSelection();
            },

            onDelete2: function () {
                let model = this.getView().getModel("secondTable");
                let table = this.byId("itemsTable2");
                let selectedIndices = table.getSelectedIndices();
                let modelData = model.getData();
                selectedIndices.sort((a, b) => b - a).forEach(index => {
                    modelData.splice(index, 1);
                });
                model.setData(modelData);
                model.refresh();
                table.clearSelection();
            },

            onDelete3: function () {
                let model = this.getView().getModel("thirdtable");
                let table = this.byId("itemsTable03");
                let selectedIndices = table.getSelectedIndices();
                let modelData = model.getData();
                selectedIndices.sort((a, b) => b - a).forEach(index => {
                    modelData.splice(index, 1);
                });
                model.setData(modelData);
                model.refresh();
                table.clearSelection();
            },

            onDelete4: function () {
                let model = this.getView().getModel("fourthtable");
                let table = this.byId("itemsTable3");
                let selectedIndices = table.getSelectedIndices();
                let modelData = model.getData();
                selectedIndices.sort((a, b) => b - a).forEach(index => {
                    modelData.splice(index, 1);
                });
                model.setData(modelData);
                model.refresh();
                table.clearSelection();
            },

            onDelete5: function () {
                let model = this.getView().getModel("fifthTable");
                let table = this.byId("itemsTable4");
                let selectedIndices = table.getSelectedIndices();
                let modelData = model.getData();
                selectedIndices.sort((a, b) => b - a).forEach(index => {
                    modelData.splice(index, 1);
                });
                model.setData(modelData);
                model.refresh();
                table.clearSelection();
            },
        });
    });