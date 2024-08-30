sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/export/Spreadsheet" 
],
    function (Controller, JSONModel, MessageToast, MessageBox, Spreadsheet) {
        "use strict";

        return Controller.extend("com.kpo.supplierreport.controller.View1", {
            onInit: function () {

                let oGoodsWorkServicePurchaseModel = new JSONModel([]);
                this.getView().setModel(oGoodsWorkServicePurchaseModel, "oGoodsWorkServicePurchaseModel")
                let ContractorReportModel = new JSONModel([]);
                this.getView().setModel(ContractorReportModel, "ContractorReportModel")
                let EmployeeInWKOTModel = new JSONModel([]);
                this.getView().setModel(EmployeeInWKOTModel, "EmployeeInWKOTModel")
                let RokctznemployeeModel = new JSONModel([]);
                this.getView().setModel(RokctznemployeeModel, "RokctznemployeeModel")
                let CalculationReportModel = new JSONModel([]);
                this.getView().setModel(CalculationReportModel, "CalculationReportModel")
                this.fetchGWSDataFromODataService();
                this.fetchContractorReportData();
                this.fetchEmployeeReportData();
                this.fetchRkoctznReportData();
                this.fetchCalculationReportData();


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
                        that.fetchGWSDataFromODataService();
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
                        that.fetchGWSDataFromODataService();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },



            fetchGWSDataFromODataService: function () {
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
                                        that.fetchGWSDataFromODataService();
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
            onDownloadGWSCsv: function () {
                let oDataServiceModel = this.getOwnerComponent().getModel(); 
                var that = this;
            
                // Adjust the path and parameters based on your OData entity set
                var sPath = "/GoodsWorkServicePurchaseT"; // Replace with your OData entity set name
                
                oDataServiceModel.read(sPath, {
                    success: function(oData) {
                        // Use the retrieved data for the spreadsheet
                        that._createSpreadsheet(oData.results);
                    },
                    error: function(oError) {
                        MessageToast.show("Error fetching data from the backend");
                    }
                });
            },
            
            _createSpreadsheet: function(aData) {
                var aCols = this.createContractorReportColumnConfig(); // Create the column configuration
            
                var oSettings = {
                    workbook: {
                        columns: aCols
                    },
                    dataSource: aData, // Use the data fetched from the backend
                    fileName: 'GWSReport.xlsx',
                    worker: false // Set to true if you want to run export in a worker thread
                };
            
                var oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {
                        MessageToast.show("Table Records Downloaded");
                    })
                    .finally(function () {
                        oSheet.destroy();
                    });
            },
    
            createColumnConfig: function () {
                return [
                    { label: 'Purchase Code', property: 'purchaseCode', type: 'string' },
                    { label: 'Purchase Method', property: 'purchaseMethod', type: 'string' },
                    { label: 'Contract Number', property: 'contractNumber', type: 'string' },
                    { label: 'Contract Subject', property: 'contractSubject', type: 'string' },
                    { label: 'Contract Award Date', property: 'contractAwardDate', type: 'string' },
                    { label: 'Contract Expire Date', property: 'contractExpireDate', type: 'string' },
                    { label: 'Total Contract Value Without VAT', property: 'totalContractValueWOVAT', type: 'number' },
                    { label: 'Legal Entity', property: 'legalEntity', type: 'string' },
                    { label: 'Country', property: 'country', type: 'string' },
                    { label: 'Supplier Name', property: 'supplierName', type: 'string' },
                    { label: 'BIN', property: 'BIN', type: 'string' },
                    { label: 'Supplier Address', property: 'supplierAddress', type: 'string' },
                    { label: 'GWS Code', property: 'GWSCode', type: 'string' },
                    { label: 'Name Of Good/Work/Service', property: 'nameOfGoodWorkService', type: 'string' },
                    { label: 'UOM', property: 'UOM', type: 'string' },
                    { label: 'Procurement Scope', property: 'procurementScope', type: 'string' },
                    { label: 'Actual Amount Ex-VAT', property: 'actualAmountExVat', type: 'number' },
                    { label: 'Registration Number', property: 'registrationNumber', type: 'string' },
                    { label: 'Local Goods Manufacturer BIN', property: 'localGoodsManufacturerBin', type: 'string' },
                    { label: 'CT KZ Cert Number', property: 'CT_KZ_Cert_Num', type: 'string' },
                    { label: 'Date Of Cert Issue', property: 'dateOfCertIssue', type: 'string' },
                    { label: 'Local Content In Goods Percentage', property: 'localContentInGoodsPercentage', type: 'number' },
                    { label: 'Local Content In Work Percentage', property: 'localContentInWorkPercentage', type: 'number' }
                ];
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
            onSaveContractorReportT: function () {
                debugger;
                let oDataServiceModel = this.getOwnerComponent().getModel();
                var oLocalModelContractor = this.getView().getModel("ContractorReportModel"); // The JSON model containing the data to be saved           
                var aContractorModelData = oLocalModelContractor.getData(); // Get all data from the JSON model           
                var that = this;

                // Counters for tracking completion
                let totalEntries = aContractorModelData.length;
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

                aContractorModelData.forEach(function (oSelectedData) {
                    if (oSelectedData.ID && oSelectedData.parentKey_ID) {
                        // Entry exists in the backend, perform update
                        var sPath = `/ContractorReportT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;


                        oDataServiceModel.update(sPath, oSelectedData, {
                            success: function () {
                                completedEntries++;
                                checkCompletion();
                                that.fetchContractorReportData();
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
                            that.__addContractorReport(oDataServiceModel, oSelectedData.parentKey_ID, oSelectedData, function () {
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
                                        that.__addContractorReport(oDataServiceModel, headerID, oSelectedData, function () {
                                            completedEntries++;
                                            checkCompletion();
                                        }, function () {
                                            completedEntries++;
                                            errorsOccurred = true;
                                            checkCompletion();
                                        });
                                    } else {
                                        that._createHeader(oDataServiceModel, oSelectedData, function () {
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

            _createHeader: function (oDataServiceModel, oSelectedData, successCallback, errorCallback) {
                var that = this;
                var headerEntry = {
                    contractorReport: [oSelectedData], // Initialize with the first line item
                    vendorID: "VEN11",
                    contractNo: "CON01",
                    reportingPeriod: "2024-08-08T00:00:00",
                    status: "Draft"
                };

                oDataServiceModel.create("/LC_HeaderT", headerEntry, {
                    success: function () {
                        successCallback();
                        that.fetchContractorReportData();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },

            __addContractorReport: function (oDataServiceModel, headerID, oSelectedData, successCallback, errorCallback) {
                var that = this;
                // Construct path for adding line item to the existing header
                var path = `/LC_HeaderT('${headerID}')/contractorReport`;
                oDataServiceModel.create(path, oSelectedData, {
                    success: function () {
                        successCallback();
                        that.fetchContractorReportData();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },
            fetchContractorReportData: function () {
                let oDataServiceModel = this.getOwnerComponent().getModel(); // Get the OData model
                let oLocalModelContractor = this.getView().getModel("ContractorReportModel"); // Get your JSON model

                oDataServiceModel.read("/ContractorReportT", {
                    success: function (oData) {
                        oLocalModelContractor.setData(oData.results);
                        console.log(oData.results)
                        oLocalModelContractor.refresh();
                    },
                    error: function (oError) {
                        sap.m.MessageToast.show("Error fetching data from OData service.");
                    }
                });
            },
            onDeleteContractorReportT: function () {
                var that = this;
                var oTable = this.byId("idcontractortable"); // Use the correct table ID
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
                                var sDeletePath = `/ContractorReportT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;

                                // Perform the delete operation
                                oDataServiceModel.remove(sDeletePath, {
                                    success: function () {
                                        oTable.getBinding("rows").refresh(); // Refresh the table to reflect changes
                                        that.fetchContractorReportData();
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
            
            onDownloadContractorCsv: function () {
                let oDataServiceModel = this.getOwnerComponent().getModel(); 
                var that = this;
            
                // Adjust the path and parameters based on your OData entity set
                var sPath = "/ContractorReportT"; // Replace with your OData entity set name
                
                oDataServiceModel.read(sPath, {
                    success: function(oData) {
                        // Use the retrieved data for the spreadsheet
                        that._createSpreadsheet(oData.results);
                    },
                    error: function(oError) {
                        MessageToast.show("Error fetching data from the backend");
                    }
                });
            },
            
            _createSpreadsheet: function(aData) {
                var aCols = this.createContractorReportColumnConfig(); // Create the column configuration
            
                var oSettings = {
                    workbook: {
                        columns: aCols
                    },
                    dataSource: aData, // Use the data fetched from the backend
                    fileName: 'ContractorReport.xlsx',
                    worker: false // Set to true if you want to run export in a worker thread
                };
            
                var oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {
                        MessageToast.show("Table Records Downloaded");
                    })
                    .finally(function () {
                        oSheet.destroy();
                    });
            },
            
            createContractorReportColumnConfig: function () {
                return [
                    { label: 'Company Name', property: 'companyName', type: 'string' },
                    { label: 'Reporting Period', property: 'reportingPeriod', type: 'string' },
                    { label: 'Total Employee', property: 'totalEmployee', type: 'number' },
                    { label: 'ROK Citizen Employee', property: 'ROK_ctzn_Employee', type: 'number' }
                ];
            },
            
            
            
            

            onAddEmployeeInWKOT: function () {
                debugger
                var oLocalModelEmployeeInWKOT = this.getView().getModel("EmployeeInWKOTModel");
                let oModelEmployeeInWKOTData = oLocalModelEmployeeInWKOT.getData();
                oModelEmployeeInWKOTData.push({
                    companyName: "",
                    reportingPeriod: "",
                    totalEmployee: "",
                    rokEmployeeInvolvedInWKO: "",
                    foreignEmpInvolvedInWKO: "",


                })

                oLocalModelEmployeeInWKOT.setData(oModelEmployeeInWKOTData);
                oLocalModelEmployeeInWKOT.refresh()


            },
            onSaveEmployeeInWKOT: function () {
                debugger;
                let oDataServiceModel = this.getOwnerComponent().getModel();
                var oLocalModelEmployeeInWKOT = this.getView().getModel("EmployeeInWKOTModel"); // The JSON model containing the data to be saved           
                var aModelEmployeeInWKOTData = oLocalModelEmployeeInWKOT.getData(); // Get all data from the JSON model           
                var that = this;

                // Counters for tracking completion
                let totalEntries = aModelEmployeeInWKOTData.length;
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

                aModelEmployeeInWKOTData.forEach(function (oSelectedData) {
                    if (oSelectedData.ID && oSelectedData.parentKey_ID) {
                        // Entry exists in the backend, perform update
                        var sPath = `/EmployeeInWKOT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;

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
                            that._addEmpoyeINWKOItem(oDataServiceModel, oSelectedData.parentKey_ID, oSelectedData, function () {
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
                                        that._addEmpoyeINWKOItem(oDataServiceModel, headerID, oSelectedData, function () {
                                            completedEntries++;
                                            checkCompletion();
                                        }, function () {
                                            completedEntries++;
                                            errorsOccurred = true;
                                            checkCompletion();
                                        });
                                    } else {
                                        that._createEmployeNewHeader(oDataServiceModel, oSelectedData, function () {
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

            _createEmployeNewHeader: function (oDataServiceModel, oSelectedData, successCallback, errorCallback) {
                var that = this;
                var headerEntry = {
                    employeeInWokReport: [oSelectedData], // Initialize with the first line item
                    vendorID: "VEN11",
                    contractNo: "CON01",
                    reportingPeriod: "2024-08-08T00:00:00",
                    status: "Draft"
                };

                oDataServiceModel.create("/LC_HeaderT", headerEntry, {
                    success: function () {
                        successCallback();
                        that.fetchEmployeeReportData();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },

            _addEmpoyeINWKOItem: function (oDataServiceModel, headerID, oSelectedData, successCallback, errorCallback) {
                var that = this;
                // Construct path for adding line item to the existing header
                var path = `/LC_HeaderT('${headerID}')/employeeInWokReport`;
                oDataServiceModel.create(path, oSelectedData, {
                    success: function () {
                        successCallback();
                        that.fetchEmployeeReportData();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },
            fetchEmployeeReportData: function () {
                let oDataServiceModel = this.getOwnerComponent().getModel(); // Get the OData model
                let oLocalModelEmployeeInWKOT = this.getView().getModel("EmployeeInWKOTModel"); // Get your JSON model

                oDataServiceModel.read("/EmployeeInWKOT", {
                    success: function (oData) {
                        oLocalModelEmployeeInWKOT.setData(oData.results);
                        console.log(oData.results)
                        oLocalModelEmployeeInWKOT.refresh();
                    },
                    error: function (oError) {
                        sap.m.MessageToast.show("Error fetching data from OData service.");
                    }
                });
            },
            onDeleteEmployeeInWKOT: function () {
                var that = this;
                var oTable = this.byId("idEmployeeInWKOTtable"); // Use the correct table ID
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
                                var sDeletePath = `/EmployeeInWKOT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;

                                // Perform the delete operation
                                oDataServiceModel.remove(sDeletePath, {
                                    success: function () {
                                        oTable.getBinding("rows").refresh(); // Refresh the table to reflect changes
                                        that.fetchEmployeeReportData();
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
            onDownloadEmployeeInWKOTCsv: function () {

                let oDataServiceModel = this.getOwnerComponent().getModel(); 
                var that = this;
            
                // Adjust the path and parameters based on your OData entity set
                var sPath = "/EmployeeInWKOT"; // Replace with your OData entity set name
                
                oDataServiceModel.read(sPath, {
                    success: function(oData) {
                        // Use the retrieved data for the spreadsheet
                        that._createSpreadsheet(oData.results);
                    },
                    error: function(oError) {
                        MessageToast.show("Error fetching data from the backend");
                    }
                });
            },
            
            _createSpreadsheet: function(aData) {
                var aCols = this.createContractorReportColumnConfig(); // Create the column configuration
            
                var oSettings = {
                    workbook: {
                        columns: aCols
                    },
                    dataSource: aData, // Use the data fetched from the backend
                    fileName: 'EmployeeInWKO.xlsx',
                    worker: false // Set to true if you want to run export in a worker thread
                };
            
                var oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {
                        MessageToast.show("Table Records Downloaded");
                    })
                    .finally(function () {
                        oSheet.destroy();
                    });
            },
            createEmployeeInWKOTColumnConfig: function () {
                return [
                    { label: 'Company Name', property: 'companyName', type: 'string' },
                    { label: 'Reporting Period', property: 'reportingPeriod', type: 'string' },
                    { label: 'Total Employee', property: 'totalEmployee', type: 'number' },
                    { label: 'ROK Employee Involved in WKO', property: 'rokEmployeeInvolvedInWKO', type: 'number' },
                    { label: 'Foreign Employee Involved in WKO', property: 'foreignEmpInvolvedInWKO', type: 'number' }
                ];
            },                
            
            onAddRokCtznEmployee: function () {
                debugger
                var oLocalModelRokctnzEmploye = this.getView().getModel("RokctznemployeeModel");
                let oModelRokctznEmployeData = oLocalModelRokctnzEmploye.getData();
                oModelRokctznEmployeData.push({
                    companyName: "",
                    reportingPeriod: "",
                    totalPayrollEmployeePercentage: "",
                    share_of_rok_ctzn_emp_payroll: "",


                })

                oLocalModelRokctnzEmploye.setData(oModelRokctznEmployeData);
                oLocalModelRokctnzEmploye.refresh()



            },
            onSaveRokctnemployee: function () {
                debugger;
                let oDataServiceModel = this.getOwnerComponent().getModel();
                var oLocalModelRokctnzEmploye = this.getView().getModel("RokctznemployeeModel"); // The JSON model containing the data to be saved           
                var oModelRokctznEmployeData = oLocalModelRokctnzEmploye.getData(); // Get all data from the JSON model           
                var that = this;

                // Counters for tracking completion
                let totalEntries = oModelRokctznEmployeData.length;
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

                oModelRokctznEmployeData.forEach(function (oSelectedData) {
                    if (oSelectedData.ID && oSelectedData.parentKey_ID) {
                        // Entry exists in the backend, perform update
                        var sPath = `/ROK_CTZN_Employee_ReportT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;

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
                            that._addRokctznEmployeItem(oDataServiceModel, oSelectedData.parentKey_ID, oSelectedData, function () {
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
                                        that._addRokctznEmployeItem(oDataServiceModel, headerID, oSelectedData, function () {
                                            completedEntries++;
                                            checkCompletion();
                                        }, function () {
                                            completedEntries++;
                                            errorsOccurred = true;
                                            checkCompletion();
                                        });
                                    } else {
                                        that._createNewRokctznHeader(oDataServiceModel, oSelectedData, function () {
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

            _createNewRokctznHeader: function (oDataServiceModel, oSelectedData, successCallback, errorCallback) {
                var that = this;
                var headerEntry = {
                    rokCtznEmpReport: [oSelectedData], // Initialize with the first line item
                    vendorID: "VEN11",
                    contractNo: "CON01",
                    reportingPeriod: "2024-08-08T00:00:00",
                    status: "Draft"
                };

                oDataServiceModel.create("/LC_HeaderT", headerEntry, {
                    success: function () {
                        successCallback();
                        that.fetchRkoctznReportData();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },

            _addRokctznEmployeItem: function (oDataServiceModel, headerID, oSelectedData, successCallback, errorCallback) {
                var that = this;
                // Construct path for adding line item to the existing header
                var path = `/LC_HeaderT('${headerID}')/rokCtznEmpReport`;
                oDataServiceModel.create(path, oSelectedData, {
                    success: function () {
                        successCallback();
                        that.fetchRkoctznReportData();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },
            fetchRkoctznReportData: function () {
                let oDataServiceModel = this.getOwnerComponent().getModel(); // Get the OData model
                let oLocalModelRokctnzEmploye = this.getView().getModel("RokctznemployeeModel"); // Get your JSON model

                oDataServiceModel.read("/ROK_CTZN_Employee_ReportT", {
                    success: function (oData) {
                        oLocalModelRokctnzEmploye.setData(oData.results);
                        console.log(oData.results)
                        oLocalModelRokctnzEmploye.refresh();
                    },
                    error: function (oError) {
                        sap.m.MessageToast.show("Error fetching data from OData service.");
                    }
                });
            },
            onDeleteRokctnemployee: function () {
                var that = this;
                var oTable = this.byId("idRokctznemployeetable"); // Use the correct table ID
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
                                var sDeletePath = `/ROK_CTZN_Employee_ReportT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;

                                // Perform the delete operation
                                oDataServiceModel.remove(sDeletePath, {
                                    success: function () {
                                        oTable.getBinding("rows").refresh(); // Refresh the table to reflect changes
                                        that.fetchRkoctznReportData();
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
            onDownloadRokctznemployeCsv: function () {
                 let oDataServiceModel = this.getOwnerComponent().getModel(); 
                var that = this;
            
                // Adjust the path and parameters based on your OData entity set
                var sPath = "/ROK_CTZN_Employee_ReportT"; // Replace with your OData entity set name
                
                oDataServiceModel.read(sPath, {
                    success: function(oData) {
                        // Use the retrieved data for the spreadsheet
                        that._createSpreadsheet(oData.results);
                    },
                    error: function(oError) {
                        MessageToast.show("Error fetching data from the backend");
                    }
                });
            },
            
            _createSpreadsheet: function(aData) {
                var aCols = this.createContractorReportColumnConfig(); // Create the column configuration
            
                var oSettings = {
                    workbook: {
                        columns: aCols
                    },
                    dataSource: aData, // Use the data fetched from the backend
                    fileName: 'ROK_CTZN_Employee_Report.xlsx',
                    worker: false // Set to true if you want to run export in a worker thread
                };
            
                var oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {
                        MessageToast.show("Table Records Downloaded");
                    })
                    .finally(function () {
                        oSheet.destroy();
                    });
            },
            createRokctznemployeeColumnConfig: function () {
                return [
                    { label: 'Company Name', property: 'companyName', type: 'string' },
                    { label: 'Reporting Period', property: 'reportingPeriod', type: 'string' },
                    { label: 'Total Payroll Employee Percentage', property: 'totalPayrollEmployeePercentage', type: 'number' },
                    { label: 'Share of ROK Citizen Employee Payroll', property: 'share_of_rok_ctzn_emp_payroll', type: 'number' }
                ];
            },
            
            onAddCalculation: function () {
                debugger
                var oLocalModelCalculation = this.getView().getModel("CalculationReportModel");
                let oModelCalculationData = oLocalModelCalculation.getData();
                oModelCalculationData.push({
                    companyName: "",
                    nameOfGoodService: "",
                    UOM: "",
                    volumeOfPurchase: 0.0,
                    actualVolumeExVat: 0.0,

                    localContentInTenge: 0.0,

                    localContentInGoodsPercentage: 0.0,

                    localContentInWorkPercentage: 0.0,

                    localGoodsManufacturer: "",
                    localGoodsManufacturerBin: "",
                    GWSCode: "",
                    CT_KZ_Cert_Num: "",
                    dateOfCertIssue: "",
                    regionOfManufacturer: "",
                })

                oLocalModelCalculation.setData(oModelCalculationData);
                oLocalModelCalculation.refresh()

            },

            onSaveCalculation: function () {
                debugger;
                let oDataServiceModel = this.getOwnerComponent().getModel();
                var oLocalModelCalculation = this.getView().getModel("CalculationReportModel"); // The JSON model containing the data to be saved           
                var aCalculationModelData = oLocalModelCalculation.getData(); // Get all data from the JSON model           
                var that = this;

                // Counters for tracking completion
                let totalEntries = aCalculationModelData.length;
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

                aCalculationModelData.forEach(function (oSelectedData) {
                    if (oSelectedData.ID && oSelectedData.parentKey_ID) {
                        // Entry exists in the backend, perform update
                        var sPath = `/LC_CalculationReportT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;

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
                            that._addCalculationItem(oDataServiceModel, oSelectedData.parentKey_ID, oSelectedData, function () {
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
                                        that._addCalculationItem(oDataServiceModel, headerID, oSelectedData, function () {
                                            completedEntries++;
                                            checkCompletion();
                                        }, function () {
                                            completedEntries++;
                                            errorsOccurred = true;
                                            checkCompletion();
                                        });
                                    } else {
                                        that._createNewCalculationHeader(oDataServiceModel, oSelectedData, function () {
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

            _createNewCalculationHeader: function (oDataServiceModel, oSelectedData, successCallback, errorCallback) {
                var that = this;
                var headerEntry = {
                    lcReport: [oSelectedData], // Initialize with the first line item
                    vendorID: "VEN11",
                    contractNo: "CON01",
                    reportingPeriod: "2024-08-08T00:00:00",
                    status: "Draft"
                };

                oDataServiceModel.create("/LC_HeaderT", headerEntry, {
                    success: function () {
                        successCallback();
                        that.fetchCalculationReportData();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },

            _addCalculationItem: function (oDataServiceModel, headerID, oSelectedData, successCallback, errorCallback) {
                var that = this;
                // Construct path for adding line item to the existing header
                var path = `/LC_HeaderT('${headerID}')/lcReport`;
                oDataServiceModel.create(path, oSelectedData, {
                    success: function () {
                        successCallback();
                        that.fetchCalculationReportData();
                    },
                    error: function (oError) {
                        errorCallback();
                    }
                });
            },



            fetchCalculationReportData: function () {
                let oDataServiceModel = this.getOwnerComponent().getModel(); // Get the OData model
                let oLocalModelCalculation = this.getView().getModel("CalculationReportModel"); // Get your JSON model

                oDataServiceModel.read("/LC_CalculationReportT", {
                    success: function (oData) {
                        oLocalModelCalculation.setData(oData.results);
                        console.log(oData.results)
                        oLocalModelCalculation.refresh();
                    },
                    error: function (oError) {
                        sap.m.MessageToast.show("Error fetching data from OData service.");
                    }
                });
            },


            onDeleteCalculation: function () {
                var that = this;
                var oTable = this.byId("idcalculationtable"); // Use the correct table ID
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
                                var sDeletePath = `/LC_CalculationReportT(parentKey_ID=${oSelectedData.parentKey_ID},ID=${oSelectedData.ID})`;

                                // Perform the delete operation
                                oDataServiceModel.remove(sDeletePath, {
                                    success: function () {
                                        oTable.getBinding("rows").refresh(); // Refresh the table to reflect changes
                                        that.fetchCalculationReportData();
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
            onDownloadCalculationCsv: function () {
                // Assuming there is no specific table for this model, we'll directly use the model's data
                let oDataServiceModel = this.getOwnerComponent().getModel(); 
                var that = this;
            
                // Adjust the path and parameters based on your OData entity set
                var sPath = "/LC_CalculationReportT"; // Replace with your OData entity set name
                
                oDataServiceModel.read(sPath, {
                    success: function(oData) {
                        // Use the retrieved data for the spreadsheet
                        that._createSpreadsheet(oData.results);
                    },
                    error: function(oError) {
                        MessageToast.show("Error fetching data from the backend");
                    }
                });
            },
            
            _createSpreadsheet: function(aData) {
                var aCols = this.createContractorReportColumnConfig(); // Create the column configuration
            
                var oSettings = {
                    workbook: {
                        columns: aCols
                    },
                    dataSource: aData, // Use the data fetched from the backend
                    fileName: 'LC_CalculationReport.xlsx',
                    worker: false // Set to true if you want to run export in a worker thread
                };
            
                var oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {
                        MessageToast.show("Table Records Downloaded");
                    })
                    .finally(function () {
                        oSheet.destroy();
                    });
            },
            createCalculationReportColumnConfig: function () {
                return [
                    { label: 'Company Name', property: 'companyName', type: 'string' },
                    { label: 'Name Of Good/Service', property: 'nameOfGoodService', type: 'string' },
                    { label: 'UOM', property: 'UOM', type: 'string' },
                    { label: 'Volume Of Purchase', property: 'volumeOfPurchase', type: 'number' },
                    { label: 'Actual Volume Ex-VAT', property: 'actualVolumeExVat', type: 'number' },
                    { label: 'Local Content In Tenge', property: 'localContentInTenge', type: 'number' },
                    { label: 'Local Content In Goods Percentage', property: 'localContentInGoodsPercentage', type: 'number' },
                    { label: 'Local Content In Work Percentage', property: 'localContentInWorkPercentage', type: 'number' },
                    { label: 'Local Goods Manufacturer', property: 'localGoodsManufacturer', type: 'string' },
                    { label: 'Local Goods Manufacturer BIN', property: 'localGoodsManufacturerBin', type: 'string' },
                    { label: 'GWS Code', property: 'GWSCode', type: 'string' },
                    { label: 'CT KZ Cert Number', property: 'CT_KZ_Cert_Num', type: 'string' },
                    { label: 'Date Of Cert Issue', property: 'dateOfCertIssue', type: 'string' },
                    { label: 'Region Of Manufacturer', property: 'regionOfManufacturer', type: 'string' }
                ];
            },
            

        });
    });