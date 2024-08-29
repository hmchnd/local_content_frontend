sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
],
    function (Controller, JSONModel, MessageToast, MessageBox) {
        "use strict";

        return Controller.extend("com.kpo.supplierreport.controller.View1", {
            onInit: function () {

                let oGoodsWorkServicePurchaseModel = new JSONModel([]);
                this.getView().setModel(oGoodsWorkServicePurchaseModel, "oGoodsWorkServicePurchaseModel")
                let ContractorReportModel = new JSONModel([]);
                this.getView().setModel(ContractorReportModel, "ContractorReportModel")
                this.fetchDataFromODataService();

            },
            onAddRow: function () {
                debugger
                var oLocalModelGWS = this.getView().getModel("oGoodsWorkServicePurchaseModel");
                let oModelGWSData = oLocalModelGWS.getData();
                oModelGWSData.push({
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

                oLocalModelGWS.setData(oModelGWSData);
                oLocalModelGWS.refresh()

            },

            onSaveTable: function () {
                debugger;
                let oDataServiceModel = this.getOwnerComponent().getModel();
                var oLocalModelGWS = this.getView().getModel("oGoodsWorkServicePurchaseModel"); // The JSON model containing the data to be saved           
                var aGWSModelData = oLocalModelGWS.getData(); // Get all data from the JSON model           
                var that = this;

                // Counters for tracking completion
                let totalEntries = aGWSModelData.length;
                let completedEntries = 0;
                let errorsOccurred = false;

                // Helper function to check completion and show message
                function checkCompletion() {
                    if (completedEntries === totalEntries) {
                        if (!errorsOccurred) {
                            MessageBox.success("Items updated successfully.");
                        } else {
                            MessageBox.error("Some items failed to update.");
                        }
                    }
                }

                aGWSModelData.forEach(function (oSelectedData) {
                    if (oSelectedData.ID && oSelectedData.parentKey_ID) {
                        // Entry exists in the backend, perform update
                        var sPath = `/GoodsWorkServicePurchaseT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;

                        oDataServiceModel.update(sPath, oSelectedData, {
                            success: function () {
                                completedEntries++;
                                checkCompletion();
                            },
                            error: function (oError) {
                                completedEntries++; // Increment the counter on error
                                errorsOccurred = true; // Set error flag to true
                                MessageToast.show("Error updating line item.");
                                checkCompletion();
                            }
                        });
                    } else {
                        // Entry might be new, check if it's in-memory (not yet saved to backend)
                        if (oSelectedData.isNew) {
                            that._addLineItem(oDataServiceModel, oSelectedData.parentKey_ID, oSelectedData, function () {
                                completedEntries++;
                                checkCompletion();
                            }, function () {
                                completedEntries++;
                                errorsOccurred = true;
                                checkCompletion();
                            });
                        } else {
                            // Check if header exists before creating a new entry
                            oDataServiceModel.read("/LC_HeaderT", {
                                filters: [
                                    new sap.ui.model.Filter("vendorID", sap.ui.model.FilterOperator.EQ, "VEN11"),
                                    new sap.ui.model.Filter("contractNo", sap.ui.model.FilterOperator.EQ, "CON01")
                                ],
                                success: function (oData) {
                                    if (oData.results && oData.results.length > 0) {
                                        var headerID = oData.results[0].ID; // Assume the header ID is stored in 'ID'
                                        that._addLineItem(oDataServiceModel, headerID, oSelectedData, function () {
                                            completedEntries++;
                                            checkCompletion();
                                        }, function () {
                                            completedEntries++;
                                            errorsOccurred = true;
                                            checkCompletion();
                                        });
                                    } else {
                                        that._createNewHeader(oDataServiceModel, oSelectedData, function () {
                                            completedEntries++;
                                            checkCompletion();
                                        }, function () {
                                            completedEntries++;
                                            errorsOccurred = true;
                                            checkCompletion();
                                        });
                                    }
                                },
                                error: function (oError) {
                                    completedEntries++;
                                    errorsOccurred = true;
                                    checkCompletion();
                                }
                            });
                        }
                    }
                });
            },

            _createNewHeader: function (oDataServiceModel, oSelectedData, successCallback, errorCallback) {
                var that = this;
                var headerEntry = {
                    gwsReport: [oSelectedData], // Initialize with the first line item
                    vendorID: "VEN11",
                    contractNo: "CON01",
                    reportingPeriod: "2024-08-08T00:00:00",
                    status: "Draft"
                };

                oDataServiceModel.create("/LC_HeaderT", headerEntry, {
                    success: function () {
                        successCallback();
                        that.fetchDataFromODataService();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },

            _addLineItem: function (oDataServiceModel, headerID, oSelectedData, successCallback, errorCallback) {
                var that = this;
                // Construct path for adding line item to the existing header
                var path = `/LC_HeaderT('${headerID}')/gwsReport`;
                oDataServiceModel.create(path, oSelectedData, {
                    success: function () {
                        successCallback();
                        that.fetchDataFromODataService();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },



            fetchDataFromODataService: function () {
                let oDataServiceModel = this.getOwnerComponent().getModel(); // Get the OData model
                let oLocalModelGWS = this.getView().getModel("oGoodsWorkServicePurchaseModel"); // Get your JSON model

                oDataServiceModel.read("/GoodsWorkServicePurchaseT", {
                    success: function (oData) {
                        oLocalModelGWS.setData(oData.results);
                        console.log(oData.results)
                        oLocalModelGWS.refresh();
                    },
                    error: function (oError) {
                        sap.m.MessageToast.show("Error fetching data from OData service.");
                    }
                });
            },


            onDeleteRow: function () {
                var that = this;
                var oTable = this.byId("idGoodsWorkServicePurchaseTable"); // Use the correct table ID
                var oDataServiceModel = this.getOwnerComponent().getModel();
                var aSelectedIndices = oTable.getSelectedIndices();

                // Check if any item is selected
                if (aSelectedIndices.length > 0) {
                    // Iterate over all selected indices
                    aSelectedIndices.forEach(function (iSelectedIndex) {
                        var oContext = oTable.getContextByIndex(iSelectedIndex);

                        if (oContext) {
                            var oSelectedData = oContext.getObject(); // Get the selected data object

                            // Check if ID and parentKey_ID are present
                            if (oSelectedData.ID && oSelectedData.parentKey_ID) {
                                var sDeletePath = `/GoodsWorkServicePurchaseT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;

                                // Perform the delete operation
                                oDataServiceModel.remove(sDeletePath, {
                                    success: function () {
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
                        }
                    });
                } else {
                    MessageToast.show("No item selected.");
                }
                MessageBox.success("Selected item deleted successfully.");

            },
            onAddContractorReportT: function () {
                debugger
                var oLocalModelContractor = this.getView().getModel("ContractorReportModel");
                let oModelContractorData = oLocalModelContractor.getData();
                oModelContractorData.push({
                    companyName: "",
                    reportingPeriod: "",
                    totalEmployee: "",
                    ROK_ctzn_Employee: "",
                    
                    
                })

                oLocalModelContractor.setData(oModelContractorData);
                oLocalModelContractor.refresh()

            },

        });
    });