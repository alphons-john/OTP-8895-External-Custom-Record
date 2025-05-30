/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/url', 'N/email'],
    /**
 * @param{email} email
 * @param{record} record
 * @param{serverWidget} serverWidget
 */
    (record, serverWidget, search, url, email) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {

                if (scriptContext.request.method === 'GET') {
                    var form = serverWidget.createForm({
                    title : 'External customer Form'
                    });
                    form.addField({
                        id : 'custpage_name',
                        type : serverWidget.FieldType.TEXT,
                        label : 'Customer Name',
                    })
                    form.addField({
                        id : 'custpage_email',
                        type : serverWidget.FieldType.TEXT,
                        label : 'Customer Email',
                    })
                    form.addField({
                        id : 'custpage_subject',
                        type : serverWidget.FieldType.TEXT,
                        label : 'Subject',
                    })
                    form.addField({
                        id : 'custpage_message',
                        type : serverWidget.FieldType.TEXT,
                        label : 'Message',
                    })

                    form.addSubmitButton({ label: 'Submit' });
                    scriptContext.response.writePage(form);
                }
                else{
                    let name = scriptContext.request.parameters.custpage_name;
                    let cuemail = scriptContext.request.parameters.custpage_email;
                    let subject = scriptContext.request.parameters.custpage_subject;
                    let message = scriptContext.request.parameters.custpage_message;
                    let custId;
                    let custEmail;
                    let salesEmail;
                   var customerSeach = search.create({
                        type: "customer",
                        filters:
                        [
                            ["email","is",cuemail]
                        ],
                        columns:
                        [
                            search.createColumn({name: "email", label: "Email"}),
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({name: "email", join: "salesRep", label: "Email"})
                        ]
                        }).run().each((result) => {
                     custEmail = result.getValue('email')
                     custId = result.getValue('internalid')
                     salesEmail = result.getValue({name: "email", join: "salesRep"})
                     log.debug(salesEmail)
                        })
                    let ExternalRecord = record.create({
                        type: "customrecord_jj_external_customer_record",
                        });
                        ExternalRecord.setValue({ fieldId: "custrecord_jj_customer_name", value: name });
                        ExternalRecord.setValue({ fieldId: "custrecord_jj_customer_email", value: email });
                        ExternalRecord.setValue({ fieldId: "custrecord_jj_subject", value: subject });
                        ExternalRecord.setValue({fieldId: "custrecord_jj_message",value: message,});
                    if(custEmail){
                        let ExternalUrl = url.resolveRecord({
                            recordType: 'customer',
                            recordId: custId,
                            isEditMode: true
                        });
                        ExternalRecord.setValue({fieldId: "custrecord_jj_customer",value: ExternalUrl,});
                    }

                    let recordId = ExternalRecord.save();
                    scriptContext.response.write(
                            `custom record created successfully! Internal ID: ${recordId}`
                        );
                        var senderId = -5;
                    if(salesEmail){
                        var recipientId = salesEmail;
                        email.send({
                            author: senderId,
                            recipients: recipientId,
                            subject: 'Record Creation',
                            body: 'custom record created',
                                })
                    }
                        email.send({
                            author: senderId,
                            recipients: -5,
                            subject: 'Record Creation',
                            body: 'custom record created',
                                })

                }
                
            } catch (error) {
                  log.debug('Unexpected Error occured', error);
            }

        }

        return {onRequest}

    });
