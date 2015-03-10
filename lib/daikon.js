/*!
 * Copyright (c) 2012-2013, RII-UTHSCSA
 * All rights reserved.
 *
 * THIS PRODUCT IS NOT FOR CLINICAL USE.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
 * following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, this list of conditions and the following
 *   disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
 *   disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * - Neither the name of the RII-UTHSCSA nor the names of its contributors may be used to endorse or promote products
 *   derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Dictionary = daikon.Dictionary || {};


/*** Static Pseudo-constants ***/

daikon.Dictionary.GROUP_INDICES = [];
daikon.Dictionary.GROUP_INDICES[0x0002] = 0;
daikon.Dictionary.GROUP_INDICES[0x0004] = 10;
daikon.Dictionary.GROUP_INDICES[0x0008] = 27;
daikon.Dictionary.GROUP_INDICES[0x0010] = 197;
daikon.Dictionary.GROUP_INDICES[0x0012] = 248;
daikon.Dictionary.GROUP_INDICES[0x0014] = 267;
daikon.Dictionary.GROUP_INDICES[0x0018] = 394;
daikon.Dictionary.GROUP_INDICES[0x0020] = 1096;
daikon.Dictionary.GROUP_INDICES[0x0022] = 1212;
daikon.Dictionary.GROUP_INDICES[0x0024] = 1317;
daikon.Dictionary.GROUP_INDICES[0x0028] = 1418;
daikon.Dictionary.GROUP_INDICES[0x0032] = 1598;
daikon.Dictionary.GROUP_INDICES[0x0038] = 1625;
daikon.Dictionary.GROUP_INDICES[0x003A] = 1653;
daikon.Dictionary.GROUP_INDICES[0x0040] = 1691;
daikon.Dictionary.GROUP_INDICES[0x0042] = 1992;
daikon.Dictionary.GROUP_INDICES[0x0046] = 2011;
daikon.Dictionary.GROUP_INDICES[0x0048] = 2060;
daikon.Dictionary.GROUP_INDICES[0x0050] = 2091;
daikon.Dictionary.GROUP_INDICES[0x0052] = 2107;
daikon.Dictionary.GROUP_INDICES[0x0054] = 2133;
daikon.Dictionary.GROUP_INDICES[0x0060] = 2213;
daikon.Dictionary.GROUP_INDICES[0x0062] = 2220;
daikon.Dictionary.GROUP_INDICES[0x0064] = 2235;
daikon.Dictionary.GROUP_INDICES[0x0066] = 2243;
daikon.Dictionary.GROUP_INDICES[0x0068] = 2288;
daikon.Dictionary.GROUP_INDICES[0x0070] = 2358;
daikon.Dictionary.GROUP_INDICES[0x0072] = 2464;
daikon.Dictionary.GROUP_INDICES[0x0074] = 2571;
daikon.Dictionary.GROUP_INDICES[0x0076] = 2629;
daikon.Dictionary.GROUP_INDICES[0x0078] = 2652;
daikon.Dictionary.GROUP_INDICES[0x0088] = 2670;
daikon.Dictionary.GROUP_INDICES[0x0100] = 2677;
daikon.Dictionary.GROUP_INDICES[0x0400] = 2681;

daikon.Dictionary.dictPrivate = [
    [0x0207,0x101F,"ElscintDataScale","FE"] // uses special Elscint double type (see Tag class)
];

daikon.Dictionary.dict = [
    [0x0002,0x0000,"Group0002Length","UL"],
    [0x0002,0x0001,"FileMetaInformationVersion","OB"],
    [0x0002,0x0002,"MediaStoredSOPClassUID","UI"],
    [0x0002,0x0003,"MediaStoredSOPInstanceUID","UI"],
    [0x0002,0x0010,"TransferSyntaxUID","UI"],
    [0x0002,0x0012,"ImplementationClassUID","UI"],
    [0x0002,0x0013,"ImplementationVersionName","SH"],
    [0x0002,0x0016,"SourceApplicationEntityTitle","AE"],
    [0x0002,0x0100,"PrivateInformationCreatorUID","UI"],
    [0x0002,0x0102,"PrivateInformation","OB"],
    [0x0004,0x0000,"Group0004Length","UL"],
    [0x0004,0x1130,"FilesetID","CS"],
    [0x0004,0x1141,"FilesetDescriptorFileFileID","CS"],
    [0x0004,0x1142,"FilesetDescriptorFileFormat","CS"],
    [0x0004,0x1200,"RootDirectoryEntitysFirstDirectoryRecordOffset","UL"],
    [0x0004,0x1202,"RootDirectoryEntitysLastDirectoryRecordOffset","UL"],
    [0x0004,0x1212,"File-setConsistenceFlag","US"],
    [0x0004,0x1220,"DirectoryRecordSequence","SQ"],
    [0x0004,0x1400,"NextDirectoryRecordOffset","UL"],
    [0x0004,0x1410,"RecordInuseFlag","US"],
    [0x0004,0x1420,"ReferencedLowerlevelDirectoryEntityOffset","UL"],
    [0x0004,0x1430,"DirectoryRecordType","CS"],
    [0x0004,0x1432,"PrivateRecordUID","UI"],
    [0x0004,0x1500,"ReferencedFileID","CS"],
    [0x0004,0x1510,"ReferencedSOPClassUIDInFile","UI"],
    [0x0004,0x1511,"ReferencedSOPInstanceUIDInFile","UI"],
    [0x0004,0x1600,"NumberOfReferences","UL"],
    [0x0008,0x0001,"LengthToEnd","UL"],
    [0x0008,0x0005,"SpecificCharacterSet","CS"],
    [0x0008,0x0006,"LanguageCodeSequence","SQ"],
    [0x0008,0x0008,"ImageType","CS"],
    [0x0008,0x0010,"RecognitionCode","SH"],
    [0x0008,0x0012,"InstanceCreationDate","DA"],
    [0x0008,0x0013,"InstanceCreationTime","TM"],
    [0x0008,0x0014,"InstanceCreatorUID","UI"],
    [0x0008,0x0016,"SOPClassUID","UI"],
    [0x0008,0x0018,"SOPInstanceUID","UI"],
    [0x0008,0x001A,"RelatedGeneralSOPClassUID","UI"],
    [0x0008,0x001B,"OriginalSpecializedSOPClassUID","UI"],
    [0x0008,0x0020,"StudyDate","DA"],
    [0x0008,0x0021,"SeriesDate","DA"],
    [0x0008,0x0022,"AcquisitionDate","DA"],
    [0x0008,0x0023,"ContentDate","DA"],
    [0x0008,0x0024,"OverlayDate","DA"],
    [0x0008,0x0025,"CurveDate","DA"],
    [0x0008,0x002A,"AcquisitionDateTime","DT"],
    [0x0008,0x0030,"StudyTime","TM"],
    [0x0008,0x0031,"SeriesTime","TM"],
    [0x0008,0x0032,"AcquisitionTime","TM"],
    [0x0008,0x0033,"ContentTime","TM"],
    [0x0008,0x0034,"OverlayTime","TM"],
    [0x0008,0x0035,"CurveTime","TM"],
    [0x0008,0x0040,"DataSetType","US"],
    [0x0008,0x0041,"DataSetSubtype","LO"],
    [0x0008,0x0042,"NuclearMedicineSeriesType","CS"],
    [0x0008,0x0050,"AccessionNumber","SH"],
    [0x0008,0x0051,"IssuerOfAccessionNumberSequence","SQ"],
    [0x0008,0x0052,"QueryRetrieveLevel","CS"],
    [0x0008,0x0054,"RetrieveAETitle","AE"],
    [0x0008,0x0056,"InstanceAvailability","CS"],
    [0x0008,0x0058,"FailedSOPInstanceUIDList","UI"],
    [0x0008,0x0060,"Modality","CS"],
    [0x0008,0x0061,"ModalitiesInStudy","CS"],
    [0x0008,0x0062,"SOPClassesInStudy","UI"],
    [0x0008,0x0064,"ConversionType","CS"],
    [0x0008,0x0068,"PresentationIntentType","CS"],
    [0x0008,0x0070,"Manufacturer","LO"],
    [0x0008,0x0080,"InstitutionName","LO"],
    [0x0008,0x0081,"InstitutionAddress","ST"],
    [0x0008,0x0082,"InstitutionCodeSequence","SQ"],
    [0x0008,0x0090,"ReferringPhysicianName","PN"],
    [0x0008,0x0092,"ReferringPhysicianAddress","ST"],
    [0x0008,0x0094,"ReferringPhysicianTelephoneNumbers","SH"],
    [0x0008,0x0096,"ReferringPhysicianIdentificationSequence","SQ"],
    [0x0008,0x0100,"CodeValue","SH"],
    [0x0008,0x0102,"CodingSchemeDesignator","SH"],
    [0x0008,0x0103,"CodingSchemeVersion","SH"],
    [0x0008,0x0104,"CodeMeaning","LO"],
    [0x0008,0x0105,"MappingResource","CS"],
    [0x0008,0x0106,"ContextGroupVersion","DT"],
    [0x0008,0x0107,"ContextGroupLocalVersion","DT"],
    [0x0008,0x010B,"ContextGroupExtensionFlag","CS"],
    [0x0008,0x010C,"CodingSchemeUID","UI"],
    [0x0008,0x010D,"ContextGroupExtensionCreatorUID","UI"],
    [0x0008,0x010F,"ContextIdentifier","CS"],
    [0x0008,0x0110,"CodingSchemeIdentificationSequence","SQ"],
    [0x0008,0x0112,"CodingSchemeRegistry","LO"],
    [0x0008,0x0114,"CodingSchemeExternalID","ST"],
    [0x0008,0x0115,"CodingSchemeName","ST"],
    [0x0008,0x0116,"CodingSchemeResponsibleOrganization","ST"],
    [0x0008,0x0117,"ContextUID","UI"],
    [0x0008,0x0201,"TimezoneOffsetFromUTC","SH"],
    [0x0008,0x1000,"NetworkID","AE"],
    [0x0008,0x1010,"StationName","SH"],
    [0x0008,0x1030,"StudyDescription","LO"],
    [0x0008,0x1032,"ProcedureCodeSequence","SQ"],
    [0x0008,0x103E,"SeriesDescription","LO"],
    [0x0008,0x103F,"SeriesDescriptionCodeSequence","SQ"],
    [0x0008,0x1040,"InstitutionalDepartmentName","LO"],
    [0x0008,0x1048,"PhysiciansOfRecord","PN"],
    [0x0008,0x1049,"PhysiciansOfRecordIdentificationSequence","SQ"],
    [0x0008,0x1050,"PerformingPhysicianName","PN"],
    [0x0008,0x1052,"PerformingPhysicianIdentificationSequence","SQ"],
    [0x0008,0x1060,"NameOfPhysiciansReadingStudy","PN"],
    [0x0008,0x1062,"PhysiciansReadingStudyIdentificationSequence","SQ"],
    [0x0008,0x1070,"OperatorsName","PN"],
    [0x0008,0x1072,"OperatorIdentificationSequence","SQ"],
    [0x0008,0x1080,"AdmittingDiagnosesDescription","LO"],
    [0x0008,0x1084,"AdmittingDiagnosesCodeSequence","SQ"],
    [0x0008,0x1090,"ManufacturerModelName","LO"],
    [0x0008,0x1100,"ReferencedResultsSequence","SQ"],
    [0x0008,0x1110,"ReferencedStudySequence","SQ"],
    [0x0008,0x1111,"ReferencedPerformedProcedureStepSequence","SQ"],
    [0x0008,0x1115,"ReferencedSeriesSequence","SQ"],
    [0x0008,0x1120,"ReferencedPatientSequence","SQ"],
    [0x0008,0x1125,"ReferencedVisitSequence","SQ"],
    [0x0008,0x1130,"ReferencedOverlaySequence","SQ"],
    [0x0008,0x1134,"ReferencedStereometricInstanceSequence","SQ"],
    [0x0008,0x113A,"ReferencedWaveformSequence","SQ"],
    [0x0008,0x1140,"ReferencedImageSequence","SQ"],
    [0x0008,0x1145,"ReferencedCurveSequence","SQ"],
    [0x0008,0x114A,"ReferencedInstanceSequence","SQ"],
    [0x0008,0x114B,"ReferencedRealWorldValueMappingInstanceSequence","SQ"],
    [0x0008,0x1150,"ReferencedSOPClassUID","UI"],
    [0x0008,0x1155,"ReferencedSOPInstanceUID","UI"],
    [0x0008,0x115A,"SOPClassesSupported","UI"],
    [0x0008,0x1160,"ReferencedFrameNumber","IS"],
    [0x0008,0x1161,"SimpleFrameList","UL"],
    [0x0008,0x1162,"CalculatedFrameList","UL"],
    [0x0008,0x1163,"TimeRange","FD"],
    [0x0008,0x1164,"FrameExtractionSequence","SQ"],
    [0x0008,0x1167,"MultiFrameSourceSOPInstanceUID","UI"],
    [0x0008,0x1195,"TransactionUID","UI"],
    [0x0008,0x1197,"FailureReason","US"],
    [0x0008,0x1198,"FailedSOPSequence","SQ"],
    [0x0008,0x1199,"ReferencedSOPSequence","SQ"],
    [0x0008,0x1200,"StudiesContainingOtherReferencedInstancesSequence","SQ"],
    [0x0008,0x1250,"RelatedSeriesSequence","SQ"],
    [0x0008,0x2110,"LossyImageCompressionRetired","CS"],
    [0x0008,0x2111,"DerivationDescription","ST"],
    [0x0008,0x2112,"SourceImageSequence","SQ"],
    [0x0008,0x2120,"StageName","SH"],
    [0x0008,0x2122,"StageNumber","IS"],
    [0x0008,0x2124,"NumberOfStages","IS"],
    [0x0008,0x2127,"ViewName","SH"],
    [0x0008,0x2128,"ViewNumber","IS"],
    [0x0008,0x2129,"NumberOfEventTimers","IS"],
    [0x0008,0x212A,"NumberOfViewsInStage","IS"],
    [0x0008,0x2130,"EventElapsedTimes","DS"],
    [0x0008,0x2132,"EventTimerNames","LO"],
    [0x0008,0x2133,"EventTimerSequence","SQ"],
    [0x0008,0x2134,"EventTimeOffset","FD"],
    [0x0008,0x2135,"EventCodeSequence","SQ"],
    [0x0008,0x2142,"StartTrim","IS"],
    [0x0008,0x2143,"StopTrim","IS"],
    [0x0008,0x2144,"RecommendedDisplayFrameRate","IS"],
    [0x0008,0x2200,"TransducerPosition","CS"],
    [0x0008,0x2204,"TransducerOrientation","CS"],
    [0x0008,0x2208,"AnatomicStructure","CS"],
    [0x0008,0x2218,"AnatomicRegionSequence","SQ"],
    [0x0008,0x2220,"AnatomicRegionModifierSequence","SQ"],
    [0x0008,0x2228,"PrimaryAnatomicStructureSequence","SQ"],
    [0x0008,0x2229,"AnatomicStructureSpaceOrRegionSequence","SQ"],
    [0x0008,0x2230,"PrimaryAnatomicStructureModifierSequence","SQ"],
    [0x0008,0x2240,"TransducerPositionSequence","SQ"],
    [0x0008,0x2242,"TransducerPositionModifierSequence","SQ"],
    [0x0008,0x2244,"TransducerOrientationSequence","SQ"],
    [0x0008,0x2246,"TransducerOrientationModifierSequence","SQ"],
    [0x0008,0x2251,"AnatomicStructureSpaceOrRegionCodeSequenceTrial","SQ"],
    [0x0008,0x2253,"AnatomicPortalOfEntranceCodeSequenceTrial","SQ"],
    [0x0008,0x2255,"AnatomicApproachDirectionCodeSequenceTrial","SQ"],
    [0x0008,0x2256,"AnatomicPerspectiveDescriptionTrial","ST"],
    [0x0008,0x2257,"AnatomicPerspectiveCodeSequenceTrial","SQ"],
    [0x0008,0x2258,"AnatomicLocationOfExaminingInstrumentDescriptionTrial","ST"],
    [0x0008,0x2259,"AnatomicLocationOfExaminingInstrumentCodeSequenceTrial","SQ"],
    [0x0008,0x225A,"AnatomicStructureSpaceOrRegionModifierCodeSequenceTrial","SQ"],
    [0x0008,0x225C,"OnAxisBackgroundAnatomicStructureCodeSequenceTrial","SQ"],
    [0x0008,0x3001,"AlternateRepresentationSequence","SQ"],
    [0x0008,0x3010,"IrradiationEventUID","UI"],
    [0x0008,0x4000,"IdentifyingComments","LT"],
    [0x0008,0x9007,"FrameType","CS"],
    [0x0008,0x9092,"ReferencedImageEvidenceSequence","SQ"],
    [0x0008,0x9121,"ReferencedRawDataSequence","SQ"],
    [0x0008,0x9123,"CreatorVersionUID","UI"],
    [0x0008,0x9124,"DerivationImageSequence","SQ"],
    [0x0008,0x9154,"SourceImageEvidenceSequence","SQ"],
    [0x0008,0x9205,"PixelPresentation","CS"],
    [0x0008,0x9206,"VolumetricProperties","CS"],
    [0x0008,0x9207,"VolumeBasedCalculationTechnique","CS"],
    [0x0008,0x9208,"ComplexImageComponent","CS"],
    [0x0008,0x9209,"AcquisitionContrast","CS"],
    [0x0008,0x9215,"DerivationCodeSequence","SQ"],
    [0x0008,0x9237,"ReferencedPresentationStateSequence","SQ"],
    [0x0008,0x9410,"ReferencedOtherPlaneSequence","SQ"],
    [0x0008,0x9458,"FrameDisplaySequence","SQ"],
    [0x0008,0x9459,"RecommendedDisplayFrameRateInFloat","FL"],
    [0x0008,0x9460,"SkipFrameRangeFlag","CS"],
    [0x0010,0x0010,"PatientName","PN"],
    [0x0010,0x0020,"PatientID","LO"],
    [0x0010,0x0021,"IssuerOfPatientID","LO"],
    [0x0010,0x0022,"TypeOfPatientID","CS"],
    [0x0010,0x0024,"IssuerOfPatientIDQualifiersSequence","SQ"],
    [0x0010,0x0030,"PatientBirthDate","DA"],
    [0x0010,0x0032,"PatientBirthTime","TM"],
    [0x0010,0x0040,"PatientSex","CS"],
    [0x0010,0x0050,"PatientInsurancePlanCodeSequence","SQ"],
    [0x0010,0x0101,"PatientPrimaryLanguageCodeSequence","SQ"],
    [0x0010,0x0102,"PatientPrimaryLanguageModifierCodeSequence","SQ"],
    [0x0010,0x1000,"OtherPatientIDs","LO"],
    [0x0010,0x1001,"OtherPatientNames","PN"],
    [0x0010,0x1002,"OtherPatientIDsSequence","SQ"],
    [0x0010,0x1005,"PatientBirthName","PN"],
    [0x0010,0x1010,"PatientAge","AS"],
    [0x0010,0x1020,"PatientSize","DS"],
    [0x0010,0x1021,"PatientSizeCodeSequence","SQ"],
    [0x0010,0x1030,"PatientWeight","DS"],
    [0x0010,0x1040,"PatientAddress","LO"],
    [0x0010,0x1050,"InsurancePlanIdentification","LO"],
    [0x0010,0x1060,"PatientMotherBirthName","PN"],
    [0x0010,0x1080,"MilitaryRank","LO"],
    [0x0010,0x1081,"BranchOfService","LO"],
    [0x0010,0x1090,"MedicalRecordLocator","LO"],
    [0x0010,0x2000,"MedicalAlerts","LO"],
    [0x0010,0x2110,"Allergies","LO"],
    [0x0010,0x2150,"CountryOfResidence","LO"],
    [0x0010,0x2152,"RegionOfResidence","LO"],
    [0x0010,0x2154,"PatientTelephoneNumbers","SH"],
    [0x0010,0x2160,"EthnicGroup","SH"],
    [0x0010,0x2180,"Occupation","SH"],
    [0x0010,0x21A0,"SmokingStatus","CS"],
    [0x0010,0x21B0,"AdditionalPatientHistory","LT"],
    [0x0010,0x21C0,"PregnancyStatus","US"],
    [0x0010,0x21D0,"LastMenstrualDate","DA"],
    [0x0010,0x21F0,"PatientReligiousPreference","LO"],
    [0x0010,0x2201,"PatientSpeciesDescription","LO"],
    [0x0010,0x2202,"PatientSpeciesCodeSequence","SQ"],
    [0x0010,0x2203,"PatientSexNeutered","CS"],
    [0x0010,0x2210,"AnatomicalOrientationType","CS"],
    [0x0010,0x2292,"PatientBreedDescription","LO"],
    [0x0010,0x2293,"PatientBreedCodeSequence","SQ"],
    [0x0010,0x2294,"BreedRegistrationSequence","SQ"],
    [0x0010,0x2295,"BreedRegistrationNumber","LO"],
    [0x0010,0x2296,"BreedRegistryCodeSequence","SQ"],
    [0x0010,0x2297,"ResponsiblePerson","PN"],
    [0x0010,0x2298,"ResponsiblePersonRole","CS"],
    [0x0010,0x2299,"ResponsibleOrganization","LO"],
    [0x0010,0x4000,"PatientComments","LT"],
    [0x0010,0x9431,"ExaminedBodyThickness","FL"],
    [0x0012,0x0010,"ClinicalTrialSponsorName","LO"],
    [0x0012,0x0020,"ClinicalTrialProtocolID","LO"],
    [0x0012,0x0021,"ClinicalTrialProtocolName","LO"],
    [0x0012,0x0030,"ClinicalTrialSiteID","LO"],
    [0x0012,0x0031,"ClinicalTrialSiteName","LO"],
    [0x0012,0x0040,"ClinicalTrialSubjectID","LO"],
    [0x0012,0x0042,"ClinicalTrialSubjectReadingID","LO"],
    [0x0012,0x0050,"ClinicalTrialTimePointID","LO"],
    [0x0012,0x0051,"ClinicalTrialTimePointDescription","ST"],
    [0x0012,0x0060,"ClinicalTrialCoordinatingCenterName","LO"],
    [0x0012,0x0062,"PatientIdentityRemoved","CS"],
    [0x0012,0x0063,"DeidentificationMethod","LO"],
    [0x0012,0x0064,"DeidentificationMethodCodeSequence","SQ"],
    [0x0012,0x0071,"ClinicalTrialSeriesID","LO"],
    [0x0012,0x0072,"ClinicalTrialSeriesDescription","LO"],
    [0x0012,0x0081,"ClinicalTrialProtocolEthicsCommitteeName","LO"],
    [0x0012,0x0082,"ClinicalTrialProtocolEthicsCommitteeApprovalNumber","LO"],
    [0x0012,0x0083,"ConsentForClinicalTrialUseSequence","SQ"],
    [0x0012,0x0084,"DistributionType","CS"],
    [0x0012,0x0085,"ConsentForDistributionFlag","CS"],
    [0x0014,0x0023,"CADFileFormat","ST"],
    [0x0014,0x0024,"ComponentReferenceSystem","ST"],
    [0x0014,0x0025,"ComponentManufacturingProcedure","ST"],
    [0x0014,0x0028,"ComponentManufacturer","ST"],
    [0x0014,0x0030,"MaterialThickness","DS"],
    [0x0014,0x0032,"MaterialPipeDiameter","DS"],
    [0x0014,0x0034,"MaterialIsolationDiameter","DS"],
    [0x0014,0x0042,"MaterialGrade","ST"],
    [0x0014,0x0044,"MaterialPropertiesFileID","ST"],
    [0x0014,0x0045,"MaterialPropertiesFileFormat","ST"],
    [0x0014,0x0046,"MaterialNotes","LT"],
    [0x0014,0x0050,"ComponentShape","CS"],
    [0x0014,0x0052,"CurvatureType","CS"],
    [0x0014,0x0054,"OuterDiameter","DS"],
    [0x0014,0x0056,"InnerDiameter","DS"],
    [0x0014,0x1010,"ActualEnvironmentalConditions","ST"],
    [0x0014,0x1020,"ExpiryDate","DA"],
    [0x0014,0x1040,"EnvironmentalConditions","ST"],
    [0x0014,0x2002,"EvaluatorSequence","SQ"],
    [0x0014,0x2004,"EvaluatorNumber","IS"],
    [0x0014,0x2006,"EvaluatorName","PN"],
    [0x0014,0x2008,"EvaluationAttempt","IS"],
    [0x0014,0x2012,"IndicationSequence","SQ"],
    [0x0014,0x2014,"IndicationNumber ","IS"],
    [0x0014,0x2016,"IndicationLabel","SH"],
    [0x0014,0x2018,"IndicationDescription","ST"],
    [0x0014,0x201A,"IndicationType","CS"],
    [0x0014,0x201C,"IndicationDisposition","CS"],
    [0x0014,0x201E,"IndicationROISequence","SQ"],
    [0x0014,0x2030,"IndicationPhysicalPropertySequence","SQ"],
    [0x0014,0x2032,"PropertyLabel","SH"],
    [0x0014,0x2202,"CoordinateSystemNumberOfAxes ","IS"],
    [0x0014,0x2204,"CoordinateSystemAxesSequence","SQ"],
    [0x0014,0x2206,"CoordinateSystemAxisDescription","ST"],
    [0x0014,0x2208,"CoordinateSystemDataSetMapping","CS"],
    [0x0014,0x220A,"CoordinateSystemAxisNumber","IS"],
    [0x0014,0x220C,"CoordinateSystemAxisType","CS"],
    [0x0014,0x220E,"CoordinateSystemAxisUnits","CS"],
    [0x0014,0x2210,"CoordinateSystemAxisValues","OB"],
    [0x0014,0x2220,"CoordinateSystemTransformSequence","SQ"],
    [0x0014,0x2222,"TransformDescription","ST"],
    [0x0014,0x2224,"TransformNumberOfAxes","IS"],
    [0x0014,0x2226,"TransformOrderOfAxes","IS"],
    [0x0014,0x2228,"TransformedAxisUnits","CS"],
    [0x0014,0x222A,"CoordinateSystemTransformRotationAndScaleMatrix","DS"],
    [0x0014,0x222C,"CoordinateSystemTransformTranslationMatrix","DS"],
    [0x0014,0x3011,"InternalDetectorFrameTime","DS"],
    [0x0014,0x3012,"NumberOfFramesIntegrated","DS"],
    [0x0014,0x3020,"DetectorTemperatureSequence","SQ"],
    [0x0014,0x3022,"SensorName","DS"],
    [0x0014,0x3024,"HorizontalOffsetOfSensor","DS"],
    [0x0014,0x3026,"VerticalOffsetOfSensor","DS"],
    [0x0014,0x3028,"SensorTemperature","DS"],
    [0x0014,0x3040,"DarkCurrentSequence","SQ"],
    [0x0014,0x3050,"DarkCurrentCounts","OB"],
    [0x0014,0x3060,"GainCorrectionReferenceSequence","SQ"],
    [0x0014,0x3070,"AirCounts","OB"],
    [0x0014,0x3071,"KVUsedInGainCalibration","DS"],
    [0x0014,0x3072,"MAUsedInGainCalibration","DS"],
    [0x0014,0x3073,"NumberOfFramesUsedForIntegration","DS"],
    [0x0014,0x3074,"FilterMaterialUsedInGainCalibration","LO"],
    [0x0014,0x3075,"FilterThicknessUsedInGainCalibration","DS"],
    [0x0014,0x3076,"DateOfGainCalibration","DA"],
    [0x0014,0x3077,"TimeOfGainCalibration","TM"],
    [0x0014,0x3080,"BadPixelImage","OB"],
    [0x0014,0x3099,"CalibrationNotes","LT"],
    [0x0014,0x4002,"PulserEquipmentSequence","SQ"],
    [0x0014,0x4004,"PulserType","CS"],
    [0x0014,0x4006,"PulserNotes","LT"],
    [0x0014,0x4008,"ReceiverEquipmentSequence","SQ"],
    [0x0014,0x400A,"AmplifierType","CS"],
    [0x0014,0x400C,"ReceiverNotes","LT"],
    [0x0014,0x400E,"PreAmplifierEquipmentSequence","SQ"],
    [0x0014,0x400F,"PreAmplifierNotes","LT"],
    [0x0014,0x4010,"TransmitTransducerSequence","SQ"],
    [0x0014,0x4011,"ReceiveTransducerSequence","SQ"],
    [0x0014,0x4012,"NumberOfElements","US"],
    [0x0014,0x4013,"ElementShape","CS"],
    [0x0014,0x4014,"ElementDimensionA","DS"],
    [0x0014,0x4015,"ElementDimensionB","DS"],
    [0x0014,0x4016,"ElementPitch","DS"],
    [0x0014,0x4017,"MeasuredBeamDimensionA","DS"],
    [0x0014,0x4018,"MeasuredBeamDimensionB","DS"],
    [0x0014,0x4019,"LocationOfMeasuredBeamDiameter","DS"],
    [0x0014,0x401A,"NominalFrequency","DS"],
    [0x0014,0x401B,"MeasuredCenterFrequency","DS"],
    [0x0014,0x401C,"MeasuredBandwidth","DS"],
    [0x0014,0x4020,"PulserSettingsSequence","SQ"],
    [0x0014,0x4022,"PulseWidth","DS"],
    [0x0014,0x4024,"ExcitationFrequency","DS"],
    [0x0014,0x4026,"ModulationType","CS"],
    [0x0014,0x4028,"Damping","DS"],
    [0x0014,0x4030,"ReceiverSettingsSequence","SQ"],
    [0x0014,0x4031,"AcquiredSoundpathLength","DS"],
    [0x0014,0x4032,"AcquisitionCompressionType","CS"],
    [0x0014,0x4033,"AcquisitionSampleSize","IS"],
    [0x0014,0x4034,"RectifierSmoothing","DS"],
    [0x0014,0x4035,"DACSequence","SQ"],
    [0x0014,0x4036,"DACType","CS"],
    [0x0014,0x4038,"DACGainPoints","DS"],
    [0x0014,0x403A,"DACTimePoints","DS"],
    [0x0014,0x403C,"DACAmplitude","DS"],
    [0x0014,0x4040,"PreAmplifierSettingsSequence","SQ"],
    [0x0014,0x4050,"TransmitTransducerSettingsSequence","SQ"],
    [0x0014,0x4051,"ReceiveTransducerSettingsSequence","SQ"],
    [0x0014,0x4052,"IncidentAngle","DS"],
    [0x0014,0x4054,"CouplingTechnique","ST"],
    [0x0014,0x4056,"CouplingMedium","ST"],
    [0x0014,0x4057,"CouplingVelocity","DS"],
    [0x0014,0x4058,"CrystalCenterLocationX","DS"],
    [0x0014,0x4059,"CrystalCenterLocationZ","DS"],
    [0x0014,0x405A,"SoundPathLength","DS"],
    [0x0014,0x405C,"DelayLawIdentifier","ST"],
    [0x0014,0x4060,"GateSettingsSequence","SQ"],
    [0x0014,0x4062,"GateThreshold","DS"],
    [0x0014,0x4064,"VelocityOfSound","DS"],
    [0x0014,0x4070,"CalibrationSettingsSequence","SQ"],
    [0x0014,0x4072,"CalibrationProcedure","ST"],
    [0x0014,0x4074,"ProcedureVersion","SH"],
    [0x0014,0x4076,"ProcedureCreationDate","DA"],
    [0x0014,0x4078,"ProcedureExpirationDate","DA"],
    [0x0014,0x407A,"ProcedureLastModifiedDate","DA"],
    [0x0014,0x407C,"CalibrationTime","TM"],
    [0x0014,0x407E,"CalibrationDate","DA"],
    [0x0014,0x5002,"LINACEnergy","IS"],
    [0x0014,0x5004,"LINACOutput","IS"],
    [0x0018,0x0010,"ContrastBolusAgent","LO"],
    [0x0018,0x0012,"ContrastBolusAgentSequence","SQ"],
    [0x0018,0x0014,"ContrastBolusAdministrationRouteSequence","SQ"],
    [0x0018,0x0015,"BodyPartExamined","CS"],
    [0x0018,0x0020,"ScanningSequence","CS"],
    [0x0018,0x0021,"SequenceVariant","CS"],
    [0x0018,0x0022,"ScanOptions","CS"],
    [0x0018,0x0023,"MRAcquisitionType","CS"],
    [0x0018,0x0024,"SequenceName","SH"],
    [0x0018,0x0025,"AngioFlag","CS"],
    [0x0018,0x0026,"InterventionDrugInformationSequence","SQ"],
    [0x0018,0x0027,"InterventionDrugStopTime","TM"],
    [0x0018,0x0028,"InterventionDrugDose","DS"],
    [0x0018,0x0029,"InterventionDrugCodeSequence","SQ"],
    [0x0018,0x002A,"AdditionalDrugSequence","SQ"],
    [0x0018,0x0030,"Radionuclide","LO"],
    [0x0018,0x0031,"Radiopharmaceutical","LO"],
    [0x0018,0x0032,"EnergyWindowCenterline","DS"],
    [0x0018,0x0033,"EnergyWindowTotalWidth","DS"],
    [0x0018,0x0034,"InterventionDrugName","LO"],
    [0x0018,0x0035,"InterventionDrugStartTime","TM"],
    [0x0018,0x0036,"InterventionSequence","SQ"],
    [0x0018,0x0037,"TherapyType","CS"],
    [0x0018,0x0038,"InterventionStatus","CS"],
    [0x0018,0x0039,"TherapyDescription","CS"],
    [0x0018,0x003A,"InterventionDescription","ST"],
    [0x0018,0x0040,"CineRate","IS"],
    [0x0018,0x0042,"InitialCineRunState","CS"],
    [0x0018,0x0050,"SliceThickness","DS"],
    [0x0018,0x0060,"KVP","DS"],
    [0x0018,0x0070,"CountsAccumulated","IS"],
    [0x0018,0x0071,"AcquisitionTerminationCondition","CS"],
    [0x0018,0x0072,"EffectiveDuration","DS"],
    [0x0018,0x0073,"AcquisitionStartCondition","CS"],
    [0x0018,0x0074,"AcquisitionStartConditionData","IS"],
    [0x0018,0x0075,"AcquisitionTerminationConditionData","IS"],
    [0x0018,0x0080,"RepetitionTime","DS"],
    [0x0018,0x0081,"EchoTime","DS"],
    [0x0018,0x0082,"InversionTime","DS"],
    [0x0018,0x0083,"NumberOfAverages","DS"],
    [0x0018,0x0084,"ImagingFrequency","DS"],
    [0x0018,0x0085,"ImagedNucleus","SH"],
    [0x0018,0x0086,"EchoNumbers","IS"],
    [0x0018,0x0087,"MagneticFieldStrength","DS"],
    [0x0018,0x0088,"SpacingBetweenSlices","DS"],
    [0x0018,0x0089,"NumberOfPhaseEncodingSteps","IS"],
    [0x0018,0x0090,"DataCollectionDiameter","DS"],
    [0x0018,0x0091,"EchoTrainLength","IS"],
    [0x0018,0x0093,"PercentSampling","DS"],
    [0x0018,0x0094,"PercentPhaseFieldOfView","DS"],
    [0x0018,0x0095,"PixelBandwidth","DS"],
    [0x0018,0x1000,"DeviceSerialNumber","LO"],
    [0x0018,0x1002,"DeviceUID","UI"],
    [0x0018,0x1003,"DeviceID","LO"],
    [0x0018,0x1004,"PlateID","LO"],
    [0x0018,0x1005,"GeneratorID","LO"],
    [0x0018,0x1006,"GridID","LO"],
    [0x0018,0x1007,"CassetteID","LO"],
    [0x0018,0x1008,"GantryID","LO"],
    [0x0018,0x1010,"SecondaryCaptureDeviceID","LO"],
    [0x0018,0x1011,"HardcopyCreationDeviceID","LO"],
    [0x0018,0x1012,"DateOfSecondaryCapture","DA"],
    [0x0018,0x1014,"TimeOfSecondaryCapture","TM"],
    [0x0018,0x1016,"SecondaryCaptureDeviceManufacturer","LO"],
    [0x0018,0x1017,"HardcopyDeviceManufacturer","LO"],
    [0x0018,0x1018,"SecondaryCaptureDeviceManufacturerModelName","LO"],
    [0x0018,0x1019,"SecondaryCaptureDeviceSoftwareVersions","LO"],
    [0x0018,0x101A,"HardcopyDeviceSoftwareVersion","LO"],
    [0x0018,0x101B,"HardcopyDeviceManufacturerModelName","LO"],
    [0x0018,0x1020,"SoftwareVersions","LO"],
    [0x0018,0x1022,"VideoImageFormatAcquired","SH"],
    [0x0018,0x1023,"DigitalImageFormatAcquired","LO"],
    [0x0018,0x1030,"ProtocolName","LO"],
    [0x0018,0x1040,"ContrastBolusRoute","LO"],
    [0x0018,0x1041,"ContrastBolusVolume","DS"],
    [0x0018,0x1042,"ContrastBolusStartTime","TM"],
    [0x0018,0x1043,"ContrastBolusStopTime","TM"],
    [0x0018,0x1044,"ContrastBolusTotalDose","DS"],
    [0x0018,0x1045,"SyringeCounts","IS"],
    [0x0018,0x1046,"ContrastFlowRate","DS"],
    [0x0018,0x1047,"ContrastFlowDuration","DS"],
    [0x0018,0x1048,"ContrastBolusIngredient","CS"],
    [0x0018,0x1049,"ContrastBolusIngredientConcentration","DS"],
    [0x0018,0x1050,"SpatialResolution","DS"],
    [0x0018,0x1060,"TriggerTime","DS"],
    [0x0018,0x1061,"TriggerSourceOrType","LO"],
    [0x0018,0x1062,"NominalInterval","IS"],
    [0x0018,0x1063,"FrameTime","DS"],
    [0x0018,0x1064,"CardiacFramingType","LO"],
    [0x0018,0x1065,"FrameTimeVector","DS"],
    [0x0018,0x1066,"FrameDelay","DS"],
    [0x0018,0x1067,"ImageTriggerDelay","DS"],
    [0x0018,0x1068,"MultiplexGroupTimeOffset","DS"],
    [0x0018,0x1069,"TriggerTimeOffset","DS"],
    [0x0018,0x106A,"SynchronizationTrigger","CS"],
    [0x0018,0x106C,"SynchronizationChannel","US"],
    [0x0018,0x106E,"TriggerSamplePosition","UL"],
    [0x0018,0x1070,"RadiopharmaceuticalRoute","LO"],
    [0x0018,0x1071,"RadiopharmaceuticalVolume","DS"],
    [0x0018,0x1072,"RadiopharmaceuticalStartTime","TM"],
    [0x0018,0x1073,"RadiopharmaceuticalStopTime","TM"],
    [0x0018,0x1074,"RadionuclideTotalDose","DS"],
    [0x0018,0x1075,"RadionuclideHalfLife","DS"],
    [0x0018,0x1076,"RadionuclidePositronFraction","DS"],
    [0x0018,0x1077,"RadiopharmaceuticalSpecificActivity","DS"],
    [0x0018,0x1078,"RadiopharmaceuticalStartDateTime","DT"],
    [0x0018,0x1079,"RadiopharmaceuticalStopDateTime","DT"],
    [0x0018,0x1080,"BeatRejectionFlag","CS"],
    [0x0018,0x1081,"LowRRValue","IS"],
    [0x0018,0x1082,"HighRRValue","IS"],
    [0x0018,0x1083,"IntervalsAcquired","IS"],
    [0x0018,0x1084,"IntervalsRejected","IS"],
    [0x0018,0x1085,"PVCRejection","LO"],
    [0x0018,0x1086,"SkipBeats","IS"],
    [0x0018,0x1088,"HeartRate","IS"],
    [0x0018,0x1090,"CardiacNumberOfImages","IS"],
    [0x0018,0x1094,"TriggerWindow","IS"],
    [0x0018,0x1100,"ReconstructionDiameter","DS"],
    [0x0018,0x1110,"DistanceSourceToDetector","DS"],
    [0x0018,0x1111,"DistanceSourceToPatient","DS"],
    [0x0018,0x1114,"EstimatedRadiographicMagnificationFactor","DS"],
    [0x0018,0x1120,"GantryDetectorTilt","DS"],
    [0x0018,0x1121,"GantryDetectorSlew","DS"],
    [0x0018,0x1130,"TableHeight","DS"],
    [0x0018,0x1131,"TableTraverse","DS"],
    [0x0018,0x1134,"TableMotion","CS"],
    [0x0018,0x1135,"TableVerticalIncrement","DS"],
    [0x0018,0x1136,"TableLateralIncrement","DS"],
    [0x0018,0x1137,"TableLongitudinalIncrement","DS"],
    [0x0018,0x1138,"TableAngle","DS"],
    [0x0018,0x113A,"TableType","CS"],
    [0x0018,0x1140,"RotationDirection","CS"],
    [0x0018,0x1141,"AngularPosition","DS"],
    [0x0018,0x1142,"RadialPosition","DS"],
    [0x0018,0x1143,"ScanArc","DS"],
    [0x0018,0x1144,"AngularStep","DS"],
    [0x0018,0x1145,"CenterOfRotationOffset","DS"],
    [0x0018,0x1146,"RotationOffset","DS"],
    [0x0018,0x1147,"FieldOfViewShape","CS"],
    [0x0018,0x1149,"FieldOfViewDimensions","IS"],
    [0x0018,0x1150,"ExposureTime","IS"],
    [0x0018,0x1151,"XRayTubeCurrent","IS"],
    [0x0018,0x1152,"Exposure","IS"],
    [0x0018,0x1153,"ExposureInuAs","IS"],
    [0x0018,0x1154,"AveragePulseWidth","DS"],
    [0x0018,0x1155,"RadiationSetting","CS"],
    [0x0018,0x1156,"RectificationType","CS"],
    [0x0018,0x115A,"RadiationMode","CS"],
    [0x0018,0x115E,"ImageAndFluoroscopyAreaDoseProduct","DS"],
    [0x0018,0x1160,"FilterType","SH"],
    [0x0018,0x1161,"TypeOfFilters","LO"],
    [0x0018,0x1162,"IntensifierSize","DS"],
    [0x0018,0x1164,"ImagerPixelSpacing","DS"],
    [0x0018,0x1166,"Grid","CS"],
    [0x0018,0x1170,"GeneratorPower","IS"],
    [0x0018,0x1180,"CollimatorGridName","SH"],
    [0x0018,0x1181,"CollimatorType","CS"],
    [0x0018,0x1182,"FocalDistance","IS"],
    [0x0018,0x1183,"XFocusCenter","DS"],
    [0x0018,0x1184,"YFocusCenter","DS"],
    [0x0018,0x1190,"FocalSpots","DS"],
    [0x0018,0x1191,"AnodeTargetMaterial","CS"],
    [0x0018,0x11A0,"BodyPartThickness","DS"],
    [0x0018,0x11A2,"CompressionForce","DS"],
    [0x0018,0x1200,"DateOfLastCalibration","DA"],
    [0x0018,0x1201,"TimeOfLastCalibration","TM"],
    [0x0018,0x1210,"ConvolutionKernel","SH"],
    [0x0018,0x1240,"UpperLowerPixelValues","IS"],
    [0x0018,0x1242,"ActualFrameDuration","IS"],
    [0x0018,0x1243,"CountRate","IS"],
    [0x0018,0x1244,"PreferredPlaybackSequencing","US"],
    [0x0018,0x1250,"ReceiveCoilName","SH"],
    [0x0018,0x1251,"TransmitCoilName","SH"],
    [0x0018,0x1260,"PlateType","SH"],
    [0x0018,0x1261,"PhosphorType","LO"],
    [0x0018,0x1300,"ScanVelocity","DS"],
    [0x0018,0x1301,"WholeBodyTechnique","CS"],
    [0x0018,0x1302,"ScanLength","IS"],
    [0x0018,0x1310,"AcquisitionMatrix","US"],
    [0x0018,0x1312,"InPlanePhaseEncodingDirection","CS"],
    [0x0018,0x1314,"FlipAngle","DS"],
    [0x0018,0x1315,"VariableFlipAngleFlag","CS"],
    [0x0018,0x1316,"SAR","DS"],
    [0x0018,0x1318,"dBdt","DS"],
    [0x0018,0x1400,"AcquisitionDeviceProcessingDescription","LO"],
    [0x0018,0x1401,"AcquisitionDeviceProcessingCode","LO"],
    [0x0018,0x1402,"CassetteOrientation","CS"],
    [0x0018,0x1403,"CassetteSize","CS"],
    [0x0018,0x1404,"ExposuresOnPlate","US"],
    [0x0018,0x1405,"RelativeXRayExposure","IS"],
    [0x0018,0x1411,"ExposureIndex","DS"],
    [0x0018,0x1412,"TargetExposureIndex","DS"],
    [0x0018,0x1413,"DeviationIndex","DS"],
    [0x0018,0x1450,"ColumnAngulation","DS"],
    [0x0018,0x1460,"TomoLayerHeight","DS"],
    [0x0018,0x1470,"TomoAngle","DS"],
    [0x0018,0x1480,"TomoTime","DS"],
    [0x0018,0x1490,"TomoType","CS"],
    [0x0018,0x1491,"TomoClass","CS"],
    [0x0018,0x1495,"NumberOfTomosynthesisSourceImages","IS"],
    [0x0018,0x1500,"PositionerMotion","CS"],
    [0x0018,0x1508,"PositionerType","CS"],
    [0x0018,0x1510,"PositionerPrimaryAngle","DS"],
    [0x0018,0x1511,"PositionerSecondaryAngle","DS"],
    [0x0018,0x1520,"PositionerPrimaryAngleIncrement","DS"],
    [0x0018,0x1521,"PositionerSecondaryAngleIncrement","DS"],
    [0x0018,0x1530,"DetectorPrimaryAngle","DS"],
    [0x0018,0x1531,"DetectorSecondaryAngle","DS"],
    [0x0018,0x1600,"ShutterShape","CS"],
    [0x0018,0x1602,"ShutterLeftVerticalEdge","IS"],
    [0x0018,0x1604,"ShutterRightVerticalEdge","IS"],
    [0x0018,0x1606,"ShutterUpperHorizontalEdge","IS"],
    [0x0018,0x1608,"ShutterLowerHorizontalEdge","IS"],
    [0x0018,0x1610,"CenterOfCircularShutter","IS"],
    [0x0018,0x1612,"RadiusOfCircularShutter","IS"],
    [0x0018,0x1620,"VerticesOfThePolygonalShutter","IS"],
    [0x0018,0x1622,"ShutterPresentationValue","US"],
    [0x0018,0x1623,"ShutterOverlayGroup","US"],
    [0x0018,0x1624,"ShutterPresentationColorCIELabValue","US"],
    [0x0018,0x1700,"CollimatorShape","CS"],
    [0x0018,0x1702,"CollimatorLeftVerticalEdge","IS"],
    [0x0018,0x1704,"CollimatorRightVerticalEdge","IS"],
    [0x0018,0x1706,"CollimatorUpperHorizontalEdge","IS"],
    [0x0018,0x1708,"CollimatorLowerHorizontalEdge","IS"],
    [0x0018,0x1710,"CenterOfCircularCollimator","IS"],
    [0x0018,0x1712,"RadiusOfCircularCollimator","IS"],
    [0x0018,0x1720,"VerticesOfThePolygonalCollimator","IS"],
    [0x0018,0x1800,"AcquisitionTimeSynchronized","CS"],
    [0x0018,0x1801,"TimeSource","SH"],
    [0x0018,0x1802,"TimeDistributionProtocol","CS"],
    [0x0018,0x1803,"NTPSourceAddress","LO"],
    [0x0018,0x2001,"PageNumberVector","IS"],
    [0x0018,0x2002,"FrameLabelVector","SH"],
    [0x0018,0x2003,"FramePrimaryAngleVector","DS"],
    [0x0018,0x2004,"FrameSecondaryAngleVector","DS"],
    [0x0018,0x2005,"SliceLocationVector","DS"],
    [0x0018,0x2006,"DisplayWindowLabelVector","SH"],
    [0x0018,0x2010,"NominalScannedPixelSpacing","DS"],
    [0x0018,0x2020,"DigitizingDeviceTransportDirection","CS"],
    [0x0018,0x2030,"RotationOfScannedFilm","DS"],
    [0x0018,0x3100,"IVUSAcquisition","CS"],
    [0x0018,0x3101,"IVUSPullbackRate","DS"],
    [0x0018,0x3102,"IVUSGatedRate","DS"],
    [0x0018,0x3103,"IVUSPullbackStartFrameNumber","IS"],
    [0x0018,0x3104,"IVUSPullbackStopFrameNumber","IS"],
    [0x0018,0x3105,"LesionNumber","IS"],
    [0x0018,0x4000,"AcquisitionComments","LT"],
    [0x0018,0x5000,"OutputPower","SH"],
    [0x0018,0x5010,"TransducerData","LO"],
    [0x0018,0x5012,"FocusDepth","DS"],
    [0x0018,0x5020,"ProcessingFunction","LO"],
    [0x0018,0x5021,"PostprocessingFunction","LO"],
    [0x0018,0x5022,"MechanicalIndex","DS"],
    [0x0018,0x5024,"BoneThermalIndex","DS"],
    [0x0018,0x5026,"CranialThermalIndex","DS"],
    [0x0018,0x5027,"SoftTissueThermalIndex","DS"],
    [0x0018,0x5028,"SoftTissueFocusThermalIndex","DS"],
    [0x0018,0x5029,"SoftTissueSurfaceThermalIndex","DS"],
    [0x0018,0x5030,"DynamicRange","DS"],
    [0x0018,0x5040,"TotalGain","DS"],
    [0x0018,0x5050,"DepthOfScanField","IS"],
    [0x0018,0x5100,"PatientPosition","CS"],
    [0x0018,0x5101,"ViewPosition","CS"],
    [0x0018,0x5104,"ProjectionEponymousNameCodeSequence","SQ"],
    [0x0018,0x5210,"ImageTransformationMatrix","DS"],
    [0x0018,0x5212,"ImageTranslationVector","DS"],
    [0x0018,0x6000,"Sensitivity","DS"],
    [0x0018,0x6011,"SequenceOfUltrasoundRegions","SQ"],
    [0x0018,0x6012,"RegionSpatialFormat","US"],
    [0x0018,0x6014,"RegionDataType","US"],
    [0x0018,0x6016,"RegionFlags","UL"],
    [0x0018,0x6018,"RegionLocationMinX0","UL"],
    [0x0018,0x601A,"RegionLocationMinY0","UL"],
    [0x0018,0x601C,"RegionLocationMaxX1","UL"],
    [0x0018,0x601E,"RegionLocationMaxY1","UL"],
    [0x0018,0x6020,"ReferencePixelX0","SL"],
    [0x0018,0x6022,"ReferencePixelY0","SL"],
    [0x0018,0x6024,"PhysicalUnitsXDirection","US"],
    [0x0018,0x6026,"PhysicalUnitsYDirection","US"],
    [0x0018,0x6028,"ReferencePixelPhysicalValueX","FD"],
    [0x0018,0x602A,"ReferencePixelPhysicalValueY","FD"],
    [0x0018,0x602C,"PhysicalDeltaX","FD"],
    [0x0018,0x602E,"PhysicalDeltaY","FD"],
    [0x0018,0x6030,"TransducerFrequency","UL"],
    [0x0018,0x6031,"TransducerType","CS"],
    [0x0018,0x6032,"PulseRepetitionFrequency","UL"],
    [0x0018,0x6034,"DopplerCorrectionAngle","FD"],
    [0x0018,0x6036,"SteeringAngle","FD"],
    [0x0018,0x6038,"DopplerSampleVolumeXPositionRetired","UL"],
    [0x0018,0x6039,"DopplerSampleVolumeXPosition","SL"],
    [0x0018,0x603A,"DopplerSampleVolumeYPositionRetired","UL"],
    [0x0018,0x603B,"DopplerSampleVolumeYPosition","SL"],
    [0x0018,0x603C,"TMLinePositionX0Retired","UL"],
    [0x0018,0x603D,"TMLinePositionX0","SL"],
    [0x0018,0x603E,"TMLinePositionY0Retired","UL"],
    [0x0018,0x603F,"TMLinePositionY0","SL"],
    [0x0018,0x6040,"TMLinePositionX1Retired","UL"],
    [0x0018,0x6041,"TMLinePositionX1","SL"],
    [0x0018,0x6042,"TMLinePositionY1Retired","UL"],
    [0x0018,0x6043,"TMLinePositionY1","SL"],
    [0x0018,0x6044,"PixelComponentOrganization","US"],
    [0x0018,0x6046,"PixelComponentMask","UL"],
    [0x0018,0x6048,"PixelComponentRangeStart","UL"],
    [0x0018,0x604A,"PixelComponentRangeStop","UL"],
    [0x0018,0x604C,"PixelComponentPhysicalUnits","US"],
    [0x0018,0x604E,"PixelComponentDataType","US"],
    [0x0018,0x6050,"NumberOfTableBreakPoints","UL"],
    [0x0018,0x6052,"TableOfXBreakPoints","UL"],
    [0x0018,0x6054,"TableOfYBreakPoints","FD"],
    [0x0018,0x6056,"NumberOfTableEntries","UL"],
    [0x0018,0x6058,"TableOfPixelValues","UL"],
    [0x0018,0x605A,"TableOfParameterValues","FL"],
    [0x0018,0x6060,"RWaveTimeVector","FL"],
    [0x0018,0x7000,"DetectorConditionsNominalFlag","CS"],
    [0x0018,0x7001,"DetectorTemperature","DS"],
    [0x0018,0x7004,"DetectorType","CS"],
    [0x0018,0x7005,"DetectorConfiguration","CS"],
    [0x0018,0x7006,"DetectorDescription","LT"],
    [0x0018,0x7008,"DetectorMode","LT"],
    [0x0018,0x700A,"DetectorID","SH"],
    [0x0018,0x700C,"DateOfLastDetectorCalibration","DA"],
    [0x0018,0x700E,"TimeOfLastDetectorCalibration","TM"],
    [0x0018,0x7010,"ExposuresOnDetectorSinceLastCalibration","IS"],
    [0x0018,0x7011,"ExposuresOnDetectorSinceManufactured","IS"],
    [0x0018,0x7012,"DetectorTimeSinceLastExposure","DS"],
    [0x0018,0x7014,"DetectorActiveTime","DS"],
    [0x0018,0x7016,"DetectorActivationOffsetFromExposure","DS"],
    [0x0018,0x701A,"DetectorBinning","DS"],
    [0x0018,0x7020,"DetectorElementPhysicalSize","DS"],
    [0x0018,0x7022,"DetectorElementSpacing","DS"],
    [0x0018,0x7024,"DetectorActiveShape","CS"],
    [0x0018,0x7026,"DetectorActiveDimensions","DS"],
    [0x0018,0x7028,"DetectorActiveOrigin","DS"],
    [0x0018,0x702A,"DetectorManufacturerName","LO"],
    [0x0018,0x702B,"DetectorManufacturerModelName","LO"],
    [0x0018,0x7030,"FieldOfViewOrigin","DS"],
    [0x0018,0x7032,"FieldOfViewRotation","DS"],
    [0x0018,0x7034,"FieldOfViewHorizontalFlip","CS"],
    [0x0018,0x7036,"PixelDataAreaOriginRelativeToFOV","FL"],
    [0x0018,0x7038,"PixelDataAreaRotationAngleRelativeToFOV","FL"],
    [0x0018,0x7040,"GridAbsorbingMaterial","LT"],
    [0x0018,0x7041,"GridSpacingMaterial","LT"],
    [0x0018,0x7042,"GridThickness","DS"],
    [0x0018,0x7044,"GridPitch","DS"],
    [0x0018,0x7046,"GridAspectRatio","IS"],
    [0x0018,0x7048,"GridPeriod","DS"],
    [0x0018,0x704C,"GridFocalDistance","DS"],
    [0x0018,0x7050,"FilterMaterial","CS"],
    [0x0018,0x7052,"FilterThicknessMinimum","DS"],
    [0x0018,0x7054,"FilterThicknessMaximum","DS"],
    [0x0018,0x7056,"FilterBeamPathLengthMinimum","FL"],
    [0x0018,0x7058,"FilterBeamPathLengthMaximum","FL"],
    [0x0018,0x7060,"ExposureControlMode","CS"],
    [0x0018,0x7062,"ExposureControlModeDescription","LT"],
    [0x0018,0x7064,"ExposureStatus","CS"],
    [0x0018,0x7065,"PhototimerSetting","DS"],
    [0x0018,0x8150,"ExposureTimeInuS","DS"],
    [0x0018,0x8151,"XRayTubeCurrentInuA","DS"],
    [0x0018,0x9004,"ContentQualification","CS"],
    [0x0018,0x9005,"PulseSequenceName","SH"],
    [0x0018,0x9006,"MRImagingModifierSequence","SQ"],
    [0x0018,0x9008,"EchoPulseSequence","CS"],
    [0x0018,0x9009,"InversionRecovery","CS"],
    [0x0018,0x9010,"FlowCompensation","CS"],
    [0x0018,0x9011,"MultipleSpinEcho","CS"],
    [0x0018,0x9012,"MultiPlanarExcitation","CS"],
    [0x0018,0x9014,"PhaseContrast","CS"],
    [0x0018,0x9015,"TimeOfFlightContrast","CS"],
    [0x0018,0x9016,"Spoiling","CS"],
    [0x0018,0x9017,"SteadyStatePulseSequence","CS"],
    [0x0018,0x9018,"EchoPlanarPulseSequence","CS"],
    [0x0018,0x9019,"TagAngleFirstAxis","FD"],
    [0x0018,0x9020,"MagnetizationTransfer","CS"],
    [0x0018,0x9021,"T2Preparation","CS"],
    [0x0018,0x9022,"BloodSignalNulling","CS"],
    [0x0018,0x9024,"SaturationRecovery","CS"],
    [0x0018,0x9025,"SpectrallySelectedSuppression","CS"],
    [0x0018,0x9026,"SpectrallySelectedExcitation","CS"],
    [0x0018,0x9027,"SpatialPresaturation","CS"],
    [0x0018,0x9028,"Tagging","CS"],
    [0x0018,0x9029,"OversamplingPhase","CS"],
    [0x0018,0x9030,"TagSpacingFirstDimension","FD"],
    [0x0018,0x9032,"GeometryOfKSpaceTraversal","CS"],
    [0x0018,0x9033,"SegmentedKSpaceTraversal","CS"],
    [0x0018,0x9034,"RectilinearPhaseEncodeReordering","CS"],
    [0x0018,0x9035,"TagThickness","FD"],
    [0x0018,0x9036,"PartialFourierDirection","CS"],
    [0x0018,0x9037,"CardiacSynchronizationTechnique","CS"],
    [0x0018,0x9041,"ReceiveCoilManufacturerName","LO"],
    [0x0018,0x9042,"MRReceiveCoilSequence","SQ"],
    [0x0018,0x9043,"ReceiveCoilType","CS"],
    [0x0018,0x9044,"QuadratureReceiveCoil","CS"],
    [0x0018,0x9045,"MultiCoilDefinitionSequence","SQ"],
    [0x0018,0x9046,"MultiCoilConfiguration","LO"],
    [0x0018,0x9047,"MultiCoilElementName","SH"],
    [0x0018,0x9048,"MultiCoilElementUsed","CS"],
    [0x0018,0x9049,"MRTransmitCoilSequence","SQ"],
    [0x0018,0x9050,"TransmitCoilManufacturerName","LO"],
    [0x0018,0x9051,"TransmitCoilType","CS"],
    [0x0018,0x9052,"SpectralWidth","FD"],
    [0x0018,0x9053,"ChemicalShiftReference","FD"],
    [0x0018,0x9054,"VolumeLocalizationTechnique","CS"],
    [0x0018,0x9058,"MRAcquisitionFrequencyEncodingSteps","US"],
    [0x0018,0x9059,"Decoupling","CS"],
    [0x0018,0x9060,"DecoupledNucleus","CS"],
    [0x0018,0x9061,"DecouplingFrequency","FD"],
    [0x0018,0x9062,"DecouplingMethod","CS"],
    [0x0018,0x9063,"DecouplingChemicalShiftReference","FD"],
    [0x0018,0x9064,"KSpaceFiltering","CS"],
    [0x0018,0x9065,"TimeDomainFiltering","CS"],
    [0x0018,0x9066,"NumberOfZeroFills","US"],
    [0x0018,0x9067,"BaselineCorrection","CS"],
    [0x0018,0x9069,"ParallelReductionFactorInPlane","FD"],
    [0x0018,0x9070,"CardiacRRIntervalSpecified","FD"],
    [0x0018,0x9073,"AcquisitionDuration","FD"],
    [0x0018,0x9074,"FrameAcquisitionDateTime","DT"],
    [0x0018,0x9075,"DiffusionDirectionality","CS"],
    [0x0018,0x9076,"DiffusionGradientDirectionSequence","SQ"],
    [0x0018,0x9077,"ParallelAcquisition","CS"],
    [0x0018,0x9078,"ParallelAcquisitionTechnique","CS"],
    [0x0018,0x9079,"InversionTimes","FD"],
    [0x0018,0x9080,"MetaboliteMapDescription","ST"],
    [0x0018,0x9081,"PartialFourier","CS"],
    [0x0018,0x9082,"EffectiveEchoTime","FD"],
    [0x0018,0x9083,"MetaboliteMapCodeSequence","SQ"],
    [0x0018,0x9084,"ChemicalShiftSequence","SQ"],
    [0x0018,0x9085,"CardiacSignalSource","CS"],
    [0x0018,0x9087,"DiffusionBValue","FD"],
    [0x0018,0x9089,"DiffusionGradientOrientation","FD"],
    [0x0018,0x9090,"VelocityEncodingDirection","FD"],
    [0x0018,0x9091,"VelocityEncodingMinimumValue","FD"],
    [0x0018,0x9092,"VelocityEncodingAcquisitionSequence","SQ"],
    [0x0018,0x9093,"NumberOfKSpaceTrajectories","US"],
    [0x0018,0x9094,"CoverageOfKSpace","CS"],
    [0x0018,0x9095,"SpectroscopyAcquisitionPhaseRows","UL"],
    [0x0018,0x9096,"ParallelReductionFactorInPlaneRetired","FD"],
    [0x0018,0x9098,"TransmitterFrequency","FD"],
    [0x0018,0x9100,"ResonantNucleus","CS"],
    [0x0018,0x9101,"FrequencyCorrection","CS"],
    [0x0018,0x9103,"MRSpectroscopyFOVGeometrySequence","SQ"],
    [0x0018,0x9104,"SlabThickness","FD"],
    [0x0018,0x9105,"SlabOrientation","FD"],
    [0x0018,0x9106,"MidSlabPosition","FD"],
    [0x0018,0x9107,"MRSpatialSaturationSequence","SQ"],
    [0x0018,0x9112,"MRTimingAndRelatedParametersSequence","SQ"],
    [0x0018,0x9114,"MREchoSequence","SQ"],
    [0x0018,0x9115,"MRModifierSequence","SQ"],
    [0x0018,0x9117,"MRDiffusionSequence","SQ"],
    [0x0018,0x9118,"CardiacSynchronizationSequence","SQ"],
    [0x0018,0x9119,"MRAveragesSequence","SQ"],
    [0x0018,0x9125,"MRFOVGeometrySequence","SQ"],
    [0x0018,0x9126,"VolumeLocalizationSequence","SQ"],
    [0x0018,0x9127,"SpectroscopyAcquisitionDataColumns","UL"],
    [0x0018,0x9147,"DiffusionAnisotropyType","CS"],
    [0x0018,0x9151,"FrameReferenceDateTime","DT"],
    [0x0018,0x9152,"MRMetaboliteMapSequence","SQ"],
    [0x0018,0x9155,"ParallelReductionFactorOutOfPlane","FD"],
    [0x0018,0x9159,"SpectroscopyAcquisitionOutOfPlanePhaseSteps","UL"],
    [0x0018,0x9166,"BulkMotionStatus","CS"],
    [0x0018,0x9168,"ParallelReductionFactorSecondInPlane","FD"],
    [0x0018,0x9169,"CardiacBeatRejectionTechnique","CS"],
    [0x0018,0x9170,"RespiratoryMotionCompensationTechnique","CS"],
    [0x0018,0x9171,"RespiratorySignalSource","CS"],
    [0x0018,0x9172,"BulkMotionCompensationTechnique","CS"],
    [0x0018,0x9173,"BulkMotionSignalSource","CS"],
    [0x0018,0x9174,"ApplicableSafetyStandardAgency","CS"],
    [0x0018,0x9175,"ApplicableSafetyStandardDescription","LO"],
    [0x0018,0x9176,"OperatingModeSequence","SQ"],
    [0x0018,0x9177,"OperatingModeType","CS"],
    [0x0018,0x9178,"OperatingMode","CS"],
    [0x0018,0x9179,"SpecificAbsorptionRateDefinition","CS"],
    [0x0018,0x9180,"GradientOutputType","CS"],
    [0x0018,0x9181,"SpecificAbsorptionRateValue","FD"],
    [0x0018,0x9182,"GradientOutput","FD"],
    [0x0018,0x9183,"FlowCompensationDirection","CS"],
    [0x0018,0x9184,"TaggingDelay","FD"],
    [0x0018,0x9185,"RespiratoryMotionCompensationTechniqueDescription","ST"],
    [0x0018,0x9186,"RespiratorySignalSourceID","SH"],
    [0x0018,0x9195,"ChemicalShiftMinimumIntegrationLimitInHz","FD"],
    [0x0018,0x9196,"ChemicalShiftMaximumIntegrationLimitInHz","FD"],
    [0x0018,0x9197,"MRVelocityEncodingSequence","SQ"],
    [0x0018,0x9198,"FirstOrderPhaseCorrection","CS"],
    [0x0018,0x9199,"WaterReferencedPhaseCorrection","CS"],
    [0x0018,0x9200,"MRSpectroscopyAcquisitionType","CS"],
    [0x0018,0x9214,"RespiratoryCyclePosition","CS"],
    [0x0018,0x9217,"VelocityEncodingMaximumValue","FD"],
    [0x0018,0x9218,"TagSpacingSecondDimension","FD"],
    [0x0018,0x9219,"TagAngleSecondAxis","SS"],
    [0x0018,0x9220,"FrameAcquisitionDuration","FD"],
    [0x0018,0x9226,"MRImageFrameTypeSequence","SQ"],
    [0x0018,0x9227,"MRSpectroscopyFrameTypeSequence","SQ"],
    [0x0018,0x9231,"MRAcquisitionPhaseEncodingStepsInPlane","US"],
    [0x0018,0x9232,"MRAcquisitionPhaseEncodingStepsOutOfPlane","US"],
    [0x0018,0x9234,"SpectroscopyAcquisitionPhaseColumns","UL"],
    [0x0018,0x9236,"CardiacCyclePosition","CS"],
    [0x0018,0x9239,"SpecificAbsorptionRateSequence","SQ"],
    [0x0018,0x9240,"RFEchoTrainLength","US"],
    [0x0018,0x9241,"GradientEchoTrainLength","US"],
    [0x0018,0x9250,"ArterialSpinLabelingContrast","CS"],
    [0x0018,0x9251,"MRArterialSpinLabelingSequence","SQ"],
    [0x0018,0x9252,"ASLTechniqueDescription","LO"],
    [0x0018,0x9253,"ASLSlabNumber","US"],
    [0x0018,0x9254,"ASLSlabThickness","FD "],
    [0x0018,0x9255,"ASLSlabOrientation","FD "],
    [0x0018,0x9256,"ASLMidSlabPosition","FD "],
    [0x0018,0x9257,"ASLContext","CS"],
    [0x0018,0x9258,"ASLPulseTrainDuration","UL"],
    [0x0018,0x9259,"ASLCrusherFlag","CS"],
    [0x0018,0x925A,"ASLCrusherFlow","FD"],
    [0x0018,0x925B,"ASLCrusherDescription","LO"],
    [0x0018,0x925C,"ASLBolusCutoffFlag","CS"],
    [0x0018,0x925D,"ASLBolusCutoffTimingSequence","SQ"],
    [0x0018,0x925E,"ASLBolusCutoffTechnique","LO"],
    [0x0018,0x925F,"ASLBolusCutoffDelayTime","UL"],
    [0x0018,0x9260,"ASLSlabSequence","SQ"],
    [0x0018,0x9295,"ChemicalShiftMinimumIntegrationLimitInppm","FD"],
    [0x0018,0x9296,"ChemicalShiftMaximumIntegrationLimitInppm","FD"],
    [0x0018,0x9301,"CTAcquisitionTypeSequence","SQ"],
    [0x0018,0x9302,"AcquisitionType","CS"],
    [0x0018,0x9303,"TubeAngle","FD"],
    [0x0018,0x9304,"CTAcquisitionDetailsSequence","SQ"],
    [0x0018,0x9305,"RevolutionTime","FD"],
    [0x0018,0x9306,"SingleCollimationWidth","FD"],
    [0x0018,0x9307,"TotalCollimationWidth","FD"],
    [0x0018,0x9308,"CTTableDynamicsSequence","SQ"],
    [0x0018,0x9309,"TableSpeed","FD"],
    [0x0018,0x9310,"TableFeedPerRotation","FD"],
    [0x0018,0x9311,"SpiralPitchFactor","FD"],
    [0x0018,0x9312,"CTGeometrySequence","SQ"],
    [0x0018,0x9313,"DataCollectionCenterPatient","FD"],
    [0x0018,0x9314,"CTReconstructionSequence","SQ"],
    [0x0018,0x9315,"ReconstructionAlgorithm","CS"],
    [0x0018,0x9316,"ConvolutionKernelGroup","CS"],
    [0x0018,0x9317,"ReconstructionFieldOfView","FD"],
    [0x0018,0x9318,"ReconstructionTargetCenterPatient","FD"],
    [0x0018,0x9319,"ReconstructionAngle","FD"],
    [0x0018,0x9320,"ImageFilter","SH"],
    [0x0018,0x9321,"CTExposureSequence","SQ"],
    [0x0018,0x9322,"ReconstructionPixelSpacing","FD"],
    [0x0018,0x9323,"ExposureModulationType","CS"],
    [0x0018,0x9324,"EstimatedDoseSaving","FD"],
    [0x0018,0x9325,"CTXRayDetailsSequence","SQ"],
    [0x0018,0x9326,"CTPositionSequence","SQ"],
    [0x0018,0x9327,"TablePosition","FD"],
    [0x0018,0x9328,"ExposureTimeInms","FD"],
    [0x0018,0x9329,"CTImageFrameTypeSequence","SQ"],
    [0x0018,0x9330,"XRayTubeCurrentInmA","FD"],
    [0x0018,0x9332,"ExposureInmAs","FD"],
    [0x0018,0x9333,"ConstantVolumeFlag","CS"],
    [0x0018,0x9334,"FluoroscopyFlag","CS"],
    [0x0018,0x9335,"DistanceSourceToDataCollectionCenter","FD"],
    [0x0018,0x9337,"ContrastBolusAgentNumber","US"],
    [0x0018,0x9338,"ContrastBolusIngredientCodeSequence","SQ"],
    [0x0018,0x9340,"ContrastAdministrationProfileSequence","SQ"],
    [0x0018,0x9341,"ContrastBolusUsageSequence","SQ"],
    [0x0018,0x9342,"ContrastBolusAgentAdministered","CS"],
    [0x0018,0x9343,"ContrastBolusAgentDetected","CS"],
    [0x0018,0x9344,"ContrastBolusAgentPhase","CS"],
    [0x0018,0x9345,"CTDIvol","FD"],
    [0x0018,0x9346,"CTDIPhantomTypeCodeSequence","SQ"],
    [0x0018,0x9351,"CalciumScoringMassFactorPatient","FL"],
    [0x0018,0x9352,"CalciumScoringMassFactorDevice","FL"],
    [0x0018,0x9353,"EnergyWeightingFactor","FL"],
    [0x0018,0x9360,"CTAdditionalXRaySourceSequence","SQ"],
    [0x0018,0x9401,"ProjectionPixelCalibrationSequence","SQ"],
    [0x0018,0x9402,"DistanceSourceToIsocenter","FL"],
    [0x0018,0x9403,"DistanceObjectToTableTop","FL"],
    [0x0018,0x9404,"ObjectPixelSpacingInCenterOfBeam","FL"],
    [0x0018,0x9405,"PositionerPositionSequence","SQ"],
    [0x0018,0x9406,"TablePositionSequence","SQ"],
    [0x0018,0x9407,"CollimatorShapeSequence","SQ"],
    [0x0018,0x9410,"PlanesInAcquisition","CS"],
    [0x0018,0x9412,"XAXRFFrameCharacteristicsSequence","SQ"],
    [0x0018,0x9417,"FrameAcquisitionSequence","SQ"],
    [0x0018,0x9420,"XRayReceptorType","CS"],
    [0x0018,0x9423,"AcquisitionProtocolName","LO"],
    [0x0018,0x9424,"AcquisitionProtocolDescription","LT"],
    [0x0018,0x9425,"ContrastBolusIngredientOpaque","CS"],
    [0x0018,0x9426,"DistanceReceptorPlaneToDetectorHousing","FL"],
    [0x0018,0x9427,"IntensifierActiveShape","CS"],
    [0x0018,0x9428,"IntensifierActiveDimensions","FL"],
    [0x0018,0x9429,"PhysicalDetectorSize","FL"],
    [0x0018,0x9430,"PositionOfIsocenterProjection","FL"],
    [0x0018,0x9432,"FieldOfViewSequence","SQ"],
    [0x0018,0x9433,"FieldOfViewDescription","LO"],
    [0x0018,0x9434,"ExposureControlSensingRegionsSequence","SQ"],
    [0x0018,0x9435,"ExposureControlSensingRegionShape","CS"],
    [0x0018,0x9436,"ExposureControlSensingRegionLeftVerticalEdge","SS"],
    [0x0018,0x9437,"ExposureControlSensingRegionRightVerticalEdge","SS"],
    [0x0018,0x9438,"ExposureControlSensingRegionUpperHorizontalEdge","SS"],
    [0x0018,0x9439,"ExposureControlSensingRegionLowerHorizontalEdge","SS"],
    [0x0018,0x9440,"CenterOfCircularExposureControlSensingRegion","SS"],
    [0x0018,0x9441,"RadiusOfCircularExposureControlSensingRegion","US"],
    [0x0018,0x9442,"VerticesOfThePolygonalExposureControlSensingRegion","SS"],
    [0x0018,0x9447,"ColumnAngulationPatient","FL"],
    [0x0018,0x9449,"BeamAngle","FL"],
    [0x0018,0x9451,"FrameDetectorParametersSequence","SQ"],
    [0x0018,0x9452,"CalculatedAnatomyThickness","FL"],
    [0x0018,0x9455,"CalibrationSequence","SQ"],
    [0x0018,0x9456,"ObjectThicknessSequence","SQ"],
    [0x0018,0x9457,"PlaneIdentification","CS"],
    [0x0018,0x9461,"FieldOfViewDimensionsInFloat","FL"],
    [0x0018,0x9462,"IsocenterReferenceSystemSequence","SQ"],
    [0x0018,0x9463,"PositionerIsocenterPrimaryAngle","FL"],
    [0x0018,0x9464,"PositionerIsocenterSecondaryAngle","FL"],
    [0x0018,0x9465,"PositionerIsocenterDetectorRotationAngle","FL"],
    [0x0018,0x9466,"TableXPositionToIsocenter","FL"],
    [0x0018,0x9467,"TableYPositionToIsocenter","FL"],
    [0x0018,0x9468,"TableZPositionToIsocenter","FL"],
    [0x0018,0x9469,"TableHorizontalRotationAngle","FL"],
    [0x0018,0x9470,"TableHeadTiltAngle","FL"],
    [0x0018,0x9471,"TableCradleTiltAngle","FL"],
    [0x0018,0x9472,"FrameDisplayShutterSequence","SQ"],
    [0x0018,0x9473,"AcquiredImageAreaDoseProduct","FL"],
    [0x0018,0x9474,"CArmPositionerTabletopRelationship","CS"],
    [0x0018,0x9476,"XRayGeometrySequence","SQ"],
    [0x0018,0x9477,"IrradiationEventIdentificationSequence","SQ"],
    [0x0018,0x9504,"XRay3DFrameTypeSequence","SQ"],
    [0x0018,0x9506,"ContributingSourcesSequence","SQ"],
    [0x0018,0x9507,"XRay3DAcquisitionSequence","SQ"],
    [0x0018,0x9508,"PrimaryPositionerScanArc","FL"],
    [0x0018,0x9509,"SecondaryPositionerScanArc","FL"],
    [0x0018,0x9510,"PrimaryPositionerScanStartAngle","FL "],
    [0x0018,0x9511,"SecondaryPositionerScanStartAngle","FL"],
    [0x0018,0x9514,"PrimaryPositionerIncrement","FL"],
    [0x0018,0x9515,"SecondaryPositionerIncrement","FL"],
    [0x0018,0x9516,"StartAcquisitionDateTime","DT"],
    [0x0018,0x9517,"EndAcquisitionDateTime","DT"],
    [0x0018,0x9524,"ApplicationName","LO"],
    [0x0018,0x9525,"ApplicationVersion","LO"],
    [0x0018,0x9526,"ApplicationManufacturer","LO"],
    [0x0018,0x9527,"AlgorithmType","CS"],
    [0x0018,0x9528,"AlgorithmDescription","LO"],
    [0x0018,0x9530,"XRay3DReconstructionSequence","SQ"],
    [0x0018,0x9531,"ReconstructionDescription","LO"],
    [0x0018,0x9538,"PerProjectionAcquisitionSequence","SQ"],
    [0x0018,0x9601,"DiffusionBMatrixSequence","SQ"],
    [0x0018,0x9602,"DiffusionBValueXX","FD"],
    [0x0018,0x9603,"DiffusionBValueXY","FD"],
    [0x0018,0x9604,"DiffusionBValueXZ","FD"],
    [0x0018,0x9605,"DiffusionBValueYY","FD"],
    [0x0018,0x9606,"DiffusionBValueYZ","FD"],
    [0x0018,0x9607,"DiffusionBValueZZ","FD"],
    [0x0018,0x9701,"DecayCorrectionDateTime","DT"],
    [0x0018,0x9715,"StartDensityThreshold","FD"],
    [0x0018,0x9716,"StartRelativeDensityDifferenceThreshold","FD"],
    [0x0018,0x9717,"StartCardiacTriggerCountThreshold","FD"],
    [0x0018,0x9718,"StartRespiratoryTriggerCountThreshold","FD"],
    [0x0018,0x9719,"TerminationCountsThreshold","FD"],
    [0x0018,0x9720,"TerminationDensityThreshold","FD"],
    [0x0018,0x9721,"TerminationRelativeDensityThreshold","FD"],
    [0x0018,0x9722,"TerminationTimeThreshold","FD"],
    [0x0018,0x9723,"TerminationCardiacTriggerCountThreshold","FD"],
    [0x0018,0x9724,"TerminationRespiratoryTriggerCountThreshold","FD"],
    [0x0018,0x9725,"DetectorGeometry","CS"],
    [0x0018,0x9726,"TransverseDetectorSeparation","FD"],
    [0x0018,0x9727,"AxialDetectorDimension","FD"],
    [0x0018,0x9729,"RadiopharmaceuticalAgentNumber","US"],
    [0x0018,0x9732,"PETFrameAcquisitionSequence","SQ"],
    [0x0018,0x9733,"PETDetectorMotionDetailsSequence","SQ"],
    [0x0018,0x9734,"PETTableDynamicsSequence","SQ"],
    [0x0018,0x9735,"PETPositionSequence","SQ"],
    [0x0018,0x9736,"PETFrameCorrectionFactorsSequence","SQ"],
    [0x0018,0x9737,"RadiopharmaceuticalUsageSequence","SQ"],
    [0x0018,0x9738,"AttenuationCorrectionSource","CS"],
    [0x0018,0x9739,"NumberOfIterations","US"],
    [0x0018,0x9740,"NumberOfSubsets","US"],
    [0x0018,0x9749,"PETReconstructionSequence","SQ"],
    [0x0018,0x9751,"PETFrameTypeSequence","SQ"],
    [0x0018,0x9755,"TimeOfFlightInformationUsed","CS"],
    [0x0018,0x9756,"ReconstructionType","CS"],
    [0x0018,0x9758,"DecayCorrected","CS"],
    [0x0018,0x9759,"AttenuationCorrected","CS"],
    [0x0018,0x9760,"ScatterCorrected","CS"],
    [0x0018,0x9761,"DeadTimeCorrected","CS"],
    [0x0018,0x9762,"GantryMotionCorrected","CS"],
    [0x0018,0x9763,"PatientMotionCorrected","CS"],
    [0x0018,0x9764,"CountLossNormalizationCorrected","CS"],
    [0x0018,0x9765,"RandomsCorrected","CS"],
    [0x0018,0x9766,"NonUniformRadialSamplingCorrected","CS"],
    [0x0018,0x9767,"SensitivityCalibrated","CS"],
    [0x0018,0x9768,"DetectorNormalizationCorrection","CS"],
    [0x0018,0x9769,"IterativeReconstructionMethod","CS"],
    [0x0018,0x9770,"AttenuationCorrectionTemporalRelationship","CS"],
    [0x0018,0x9771,"PatientPhysiologicalStateSequence","SQ"],
    [0x0018,0x9772,"PatientPhysiologicalStateCodeSequence","SQ"],
    [0x0018,0x9801,"DepthsOfFocus","FD"],
    [0x0018,0x9803,"ExcludedIntervalsSequence","SQ"],
    [0x0018,0x9804,"ExclusionStartDatetime","DT"],
    [0x0018,0x9805,"ExclusionDuration","FD"],
    [0x0018,0x9806,"USImageDescriptionSequence","SQ"],
    [0x0018,0x9807,"ImageDataTypeSequence","SQ"],
    [0x0018,0x9808,"DataType","CS"],
    [0x0018,0x9809,"TransducerScanPatternCodeSequence","SQ"],
    [0x0018,0x980B,"AliasedDataType","CS"],
    [0x0018,0x980C,"PositionMeasuringDeviceUsed","CS"],
    [0x0018,0x980D,"TransducerGeometryCodeSequence","SQ"],
    [0x0018,0x980E,"TransducerBeamSteeringCodeSequence","SQ"],
    [0x0018,0x980F,"TransducerApplicationCodeSequence","SQ"],
    [0x0018,0xA001,"ContributingEquipmentSequence","SQ"],
    [0x0018,0xA002,"ContributionDateTime","DT"],
    [0x0018,0xA003,"ContributionDescription","ST"],
    [0x0020,0x000D,"StudyInstanceUID","UI"],
    [0x0020,0x000E,"SeriesInstanceUID","UI"],
    [0x0020,0x0010,"StudyID","SH"],
    [0x0020,0x0011,"SeriesNumber","IS"],
    [0x0020,0x0012,"AcquisitionNumber","IS"],
    [0x0020,0x0013,"InstanceNumber","IS"],
    [0x0020,0x0014,"IsotopeNumber","IS"],
    [0x0020,0x0015,"PhaseNumber","IS"],
    [0x0020,0x0016,"IntervalNumber","IS"],
    [0x0020,0x0017,"TimeSlotNumber","IS"],
    [0x0020,0x0018,"AngleNumber","IS"],
    [0x0020,0x0019,"ItemNumber","IS"],
    [0x0020,0x0020,"PatientOrientation","CS"],
    [0x0020,0x0022,"OverlayNumber","IS"],
    [0x0020,0x0024,"CurveNumber","IS"],
    [0x0020,0x0026,"LUTNumber","IS"],
    [0x0020,0x0030,"ImagePosition","DS"],
    [0x0020,0x0032,"ImagePositionPatient","DS"],
    [0x0020,0x0035,"ImageOrientation","DS"],
    [0x0020,0x0037,"ImageOrientationPatient","DS"],
    [0x0020,0x0050,"Location","DS"],
    [0x0020,0x0052,"FrameOfReferenceUID","UI"],
    [0x0020,0x0060,"Laterality","CS"],
    [0x0020,0x0062,"ImageLaterality","CS"],
    [0x0020,0x0070,"ImageGeometryType","LO"],
    [0x0020,0x0080,"MaskingImage","CS"],
    [0x0020,0x00AA,"ReportNumber","IS"],
    [0x0020,0x0100,"TemporalPositionIdentifier","IS"],
    [0x0020,0x0105,"NumberOfTemporalPositions","IS"],
    [0x0020,0x0110,"TemporalResolution","DS"],
    [0x0020,0x0200,"SynchronizationFrameOfReferenceUID","UI"],
    [0x0020,0x0242,"SOPInstanceUIDOfConcatenationSource","UI"],
    [0x0020,0x1000,"SeriesInStudy","IS"],
    [0x0020,0x1001,"AcquisitionsInSeries","IS"],
    [0x0020,0x1002,"ImagesInAcquisition","IS"],
    [0x0020,0x1003,"ImagesInSeries","IS"],
    [0x0020,0x1004,"AcquisitionsInStudy","IS"],
    [0x0020,0x1005,"ImagesInStudy","IS"],
    [0x0020,0x1020,"Reference","LO"],
    [0x0020,0x1040,"PositionReferenceIndicator","LO"],
    [0x0020,0x1041,"SliceLocation","DS"],
    [0x0020,0x1070,"OtherStudyNumbers","IS"],
    [0x0020,0x1200,"NumberOfPatientRelatedStudies","IS"],
    [0x0020,0x1202,"NumberOfPatientRelatedSeries","IS"],
    [0x0020,0x1204,"NumberOfPatientRelatedInstances","IS"],
    [0x0020,0x1206,"NumberOfStudyRelatedSeries","IS"],
    [0x0020,0x1208,"NumberOfStudyRelatedInstances","IS"],
    [0x0020,0x1209,"NumberOfSeriesRelatedInstances","IS"],
    [0x0020,0x3401,"ModifyingDeviceID","CS"],
    [0x0020,0x3402,"ModifiedImageID","CS"],
    [0x0020,0x3403,"ModifiedImageDate","DA"],
    [0x0020,0x3404,"ModifyingDeviceManufacturer","LO"],
    [0x0020,0x3405,"ModifiedImageTime","TM"],
    [0x0020,0x3406,"ModifiedImageDescription","LO"],
    [0x0020,0x4000,"ImageComments","LT"],
    [0x0020,0x5000,"OriginalImageIdentification","AT"],
    [0x0020,0x5002,"OriginalImageIdentificationNomenclature","LO"],
    [0x0020,0x9056,"StackID","SH"],
    [0x0020,0x9057,"InStackPositionNumber","UL"],
    [0x0020,0x9071,"FrameAnatomySequence","SQ"],
    [0x0020,0x9072,"FrameLaterality","CS"],
    [0x0020,0x9111,"FrameContentSequence","SQ"],
    [0x0020,0x9113,"PlanePositionSequence","SQ"],
    [0x0020,0x9116,"PlaneOrientationSequence","SQ"],
    [0x0020,0x9128,"TemporalPositionIndex","UL"],
    [0x0020,0x9153,"NominalCardiacTriggerDelayTime","FD"],
    [0x0020,0x9154,"NominalCardiacTriggerTimePriorToRPeak","FL"],
    [0x0020,0x9155,"ActualCardiacTriggerTimePriorToRPeak","FL"],
    [0x0020,0x9156,"FrameAcquisitionNumber","US"],
    [0x0020,0x9157,"DimensionIndexValues","UL"],
    [0x0020,0x9158,"FrameComments","LT"],
    [0x0020,0x9161,"ConcatenationUID","UI"],
    [0x0020,0x9162,"InConcatenationNumber","US"],
    [0x0020,0x9163,"InConcatenationTotalNumber","US"],
    [0x0020,0x9164,"DimensionOrganizationUID","UI"],
    [0x0020,0x9165,"DimensionIndexPointer","AT"],
    [0x0020,0x9167,"FunctionalGroupPointer","AT"],
    [0x0020,0x9213,"DimensionIndexPrivateCreator","LO"],
    [0x0020,0x9221,"DimensionOrganizationSequence","SQ"],
    [0x0020,0x9222,"DimensionIndexSequence","SQ"],
    [0x0020,0x9228,"ConcatenationFrameOffsetNumber","UL"],
    [0x0020,0x9238,"FunctionalGroupPrivateCreator","LO"],
    [0x0020,0x9241,"NominalPercentageOfCardiacPhase","FL"],
    [0x0020,0x9245,"NominalPercentageOfRespiratoryPhase","FL"],
    [0x0020,0x9246,"StartingRespiratoryAmplitude","FL"],
    [0x0020,0x9247,"StartingRespiratoryPhase","CS"],
    [0x0020,0x9248,"EndingRespiratoryAmplitude","FL"],
    [0x0020,0x9249,"EndingRespiratoryPhase","CS"],
    [0x0020,0x9250,"RespiratoryTriggerType","CS"],
    [0x0020,0x9251,"RRIntervalTimeNominal","FD"],
    [0x0020,0x9252,"ActualCardiacTriggerDelayTime","FD"],
    [0x0020,0x9253,"RespiratorySynchronizationSequence","SQ"],
    [0x0020,0x9254,"RespiratoryIntervalTime","FD"],
    [0x0020,0x9255,"NominalRespiratoryTriggerDelayTime","FD"],
    [0x0020,0x9256,"RespiratoryTriggerDelayThreshold","FD"],
    [0x0020,0x9257,"ActualRespiratoryTriggerDelayTime","FD"],
    [0x0020,0x9301,"ImagePositionVolume","FD"],
    [0x0020,0x9302,"ImageOrientationVolume","FD"],
    [0x0020,0x9307,"UltrasoundAcquisitionGeometry","CS"],
    [0x0020,0x9308,"ApexPosition","FD"],
    [0x0020,0x9309,"VolumeToTransducerMappingMatrix","FD"],
    [0x0020,0x930A,"VolumeToTableMappingMatrix","FD"],
    [0x0020,0x930C,"PatientFrameOfReferenceSource","CS"],
    [0x0020,0x930D,"TemporalPositionTimeOffset","FD"],
    [0x0020,0x930E,"PlanePositionVolumeSequence","SQ"],
    [0x0020,0x930F,"PlaneOrientationVolumeSequence","SQ"],
    [0x0020,0x9310,"TemporalPositionSequence","SQ"],
    [0x0020,0x9311,"DimensionOrganizationType","CS"],
    [0x0020,0x9312,"VolumeFrameOfReferenceUID","UI"],
    [0x0020,0x9313,"TableFrameOfReferenceUID","UI"],
    [0x0020,0x9421,"DimensionDescriptionLabel","LO"],
    [0x0020,0x9450,"PatientOrientationInFrameSequence","SQ"],
    [0x0020,0x9453,"FrameLabel","LO"],
    [0x0020,0x9518,"AcquisitionIndex","US"],
    [0x0020,0x9529,"ContributingSOPInstancesReferenceSequence","SQ"],
    [0x0020,0x9536,"ReconstructionIndex","US"],
    [0x0022,0x0001,"LightPathFilterPassThroughWavelength","US"],
    [0x0022,0x0002,"LightPathFilterPassBand","US"],
    [0x0022,0x0003,"ImagePathFilterPassThroughWavelength","US"],
    [0x0022,0x0004,"ImagePathFilterPassBand","US"],
    [0x0022,0x0005,"PatientEyeMovementCommanded","CS"],
    [0x0022,0x0006,"PatientEyeMovementCommandCodeSequence","SQ"],
    [0x0022,0x0007,"SphericalLensPower","FL"],
    [0x0022,0x0008,"CylinderLensPower","FL"],
    [0x0022,0x0009,"CylinderAxis","FL"],
    [0x0022,0x000A,"EmmetropicMagnification","FL"],
    [0x0022,0x000B,"IntraOcularPressure","FL"],
    [0x0022,0x000C,"HorizontalFieldOfView","FL"],
    [0x0022,0x000D,"PupilDilated","CS"],
    [0x0022,0x000E,"DegreeOfDilation","FL"],
    [0x0022,0x0010,"StereoBaselineAngle","FL"],
    [0x0022,0x0011,"StereoBaselineDisplacement","FL"],
    [0x0022,0x0012,"StereoHorizontalPixelOffset","FL"],
    [0x0022,0x0013,"StereoVerticalPixelOffset","FL"],
    [0x0022,0x0014,"StereoRotation","FL"],
    [0x0022,0x0015,"AcquisitionDeviceTypeCodeSequence","SQ"],
    [0x0022,0x0016,"IlluminationTypeCodeSequence","SQ"],
    [0x0022,0x0017,"LightPathFilterTypeStackCodeSequence","SQ"],
    [0x0022,0x0018,"ImagePathFilterTypeStackCodeSequence","SQ"],
    [0x0022,0x0019,"LensesCodeSequence","SQ"],
    [0x0022,0x001A,"ChannelDescriptionCodeSequence","SQ"],
    [0x0022,0x001B,"RefractiveStateSequence","SQ"],
    [0x0022,0x001C,"MydriaticAgentCodeSequence","SQ"],
    [0x0022,0x001D,"RelativeImagePositionCodeSequence","SQ"],
    [0x0022,0x001E,"CameraAngleOfView","FL"],
    [0x0022,0x0020,"StereoPairsSequence","SQ"],
    [0x0022,0x0021,"LeftImageSequence","SQ"],
    [0x0022,0x0022,"RightImageSequence","SQ"],
    [0x0022,0x0030,"AxialLengthOfTheEye","FL"],
    [0x0022,0x0031,"OphthalmicFrameLocationSequence","SQ"],
    [0x0022,0x0032,"ReferenceCoordinates","FL"],
    [0x0022,0x0035,"DepthSpatialResolution","FL"],
    [0x0022,0x0036,"MaximumDepthDistortion","FL"],
    [0x0022,0x0037,"AlongScanSpatialResolution","FL"],
    [0x0022,0x0038,"MaximumAlongScanDistortion","FL"],
    [0x0022,0x0039,"OphthalmicImageOrientation","CS"],
    [0x0022,0x0041,"DepthOfTransverseImage","FL"],
    [0x0022,0x0042,"MydriaticAgentConcentrationUnitsSequence","SQ"],
    [0x0022,0x0048,"AcrossScanSpatialResolution","FL"],
    [0x0022,0x0049,"MaximumAcrossScanDistortion","FL"],
    [0x0022,0x004E,"MydriaticAgentConcentration","DS"],
    [0x0022,0x0055,"IlluminationWaveLength","FL"],
    [0x0022,0x0056,"IlluminationPower","FL"],
    [0x0022,0x0057,"IlluminationBandwidth","FL"],
    [0x0022,0x0058,"MydriaticAgentSequence","SQ"],
    [0x0022,0x1007,"OphthalmicAxialMeasurementsRightEyeSequence","SQ"],
    [0x0022,0x1008,"OphthalmicAxialMeasurementsLeftEyeSequence","SQ"],
    [0x0022,0x1010,"OphthalmicAxialLengthMeasurementsType","CS"],
    [0x0022,0x1019,"OphthalmicAxialLength","FL"],
    [0x0022,0x1024,"LensStatusCodeSequence","SQ"],
    [0x0022,0x1025,"VitreousStatusCodeSequence","SQ"],
    [0x0022,0x1028,"IOLFormulaCodeSequence","SQ"],
    [0x0022,0x1029,"IOLFormulaDetail","LO"],
    [0x0022,0x1033,"KeratometerIndex","FL"],
    [0x0022,0x1035,"SourceOfOphthalmicAxialLengthCodeSequence","SQ"],
    [0x0022,0x1037,"TargetRefraction","FL"],
    [0x0022,0x1039,"RefractiveProcedureOccurred","CS"],
    [0x0022,0x1040,"RefractiveSurgeryTypeCodeSequence","SQ"],
    [0x0022,0x1044,"OphthalmicUltrasoundAxialMeasurementsTypeCodeSequence","SQ"],
    [0x0022,0x1050,"OphthalmicAxialLengthMeasurementsSequence","SQ"],
    [0x0022,0x1053,"IOLPower","FL"],
    [0x0022,0x1054,"PredictedRefractiveError","FL"],
    [0x0022,0x1059,"OphthalmicAxialLengthVelocity","FL"],
    [0x0022,0x1065,"LensStatusDescription","LO"],
    [0x0022,0x1066,"VitreousStatusDescription","LO"],
    [0x0022,0x1090,"IOLPowerSequence","SQ"],
    [0x0022,0x1092,"LensConstantSequence","SQ"],
    [0x0022,0x1093,"IOLManufacturer","LO"],
    [0x0022,0x1094,"LensConstantDescription","LO"],
    [0x0022,0x1096,"KeratometryMeasurementTypeCodeSequence","SQ"],
    [0x0022,0x1100,"ReferencedOphthalmicAxialMeasurementsSequence","SQ"],
    [0x0022,0x1101,"OphthalmicAxialLengthMeasurementsSegmentNameCodeSequence","SQ"],
    [0x0022,0x1103,"RefractiveErrorBeforeRefractiveSurgeryCodeSequence","SQ"],
    [0x0022,0x1121,"IOLPowerForExactEmmetropia","FL"],
    [0x0022,0x1122,"IOLPowerForExactTargetRefraction","FL"],
    [0x0022,0x1125,"AnteriorChamberDepthDefinitionCodeSequence","SQ"],
    [0x0022,0x1130,"LensThickness","FL"],
    [0x0022,0x1131,"AnteriorChamberDepth","FL"],
    [0x0022,0x1132,"SourceOfLensThicknessDataCodeSequence","SQ"],
    [0x0022,0x1133,"SourceOfAnteriorChamberDepthDataCodeSequence","SQ"],
    [0x0022,0x1135,"SourceOfRefractiveErrorDataCodeSequence","SQ"],
    [0x0022,0x1140,"OphthalmicAxialLengthMeasurementModified","CS"],
    [0x0022,0x1150,"OphthalmicAxialLengthDataSourceCodeSequence","SQ"],
    [0x0022,0x1153,"OphthalmicAxialLengthAcquisitionMethodCodeSequence","SQ"],
    [0x0022,0x1155,"SignalToNoiseRatio","FL"],
    [0x0022,0x1159,"OphthalmicAxialLengthDataSourceDescription","LO"],
    [0x0022,0x1210,"OphthalmicAxialLengthMeasurementsTotalLengthSequence","SQ"],
    [0x0022,0x1211,"OphthalmicAxialLengthMeasurementsSegmentalLengthSequence","SQ"],
    [0x0022,0x1212,"OphthalmicAxialLengthMeasurementsLengthSummationSequence","SQ"],
    [0x0022,0x1220,"UltrasoundOphthalmicAxialLengthMeasurementsSequence","SQ"],
    [0x0022,0x1225,"OpticalOphthalmicAxialLengthMeasurementsSequence","SQ"],
    [0x0022,0x1230,"UltrasoundSelectedOphthalmicAxialLengthSequence","SQ"],
    [0x0022,0x1250,"OphthalmicAxialLengthSelectionMethodCodeSequence","SQ"],
    [0x0022,0x1255,"OpticalSelectedOphthalmicAxialLengthSequence","SQ"],
    [0x0022,0x1257,"SelectedSegmentalOphthalmicAxialLengthSequence","SQ"],
    [0x0022,0x1260,"SelectedTotalOphthalmicAxialLengthSequence","SQ"],
    [0x0022,0x1262,"OphthalmicAxialLengthQualityMetricSequence","SQ"],
    [0x0022,0x1273,"OphthalmicAxialLengthQualityMetricTypeDescription","LO"],
    [0x0022,0x1300,"IntraocularLensCalculationsRightEyeSequence","SQ"],
    [0x0022,0x1310,"IntraocularLensCalculationsLeftEyeSequence","SQ"],
    [0x0022,0x1330,"ReferencedOphthalmicAxialLengthMeasurementQCImageSequence","SQ"],
    [0x0024,0x0010,"VisualFieldHorizontalExtent","FL"],
    [0x0024,0x0011,"VisualFieldVerticalExtent","FL"],
    [0x0024,0x0012,"VisualFieldShape","CS"],
    [0x0024,0x0016,"ScreeningTestModeCodeSequence","SQ"],
    [0x0024,0x0018,"MaximumStimulusLuminance","FL"],
    [0x0024,0x0020,"BackgroundLuminance","FL"],
    [0x0024,0x0021,"StimulusColorCodeSequence","SQ"],
    [0x0024,0x0024,"BackgroundIlluminationColorCodeSequence","SQ"],
    [0x0024,0x0025,"StimulusArea","FL"],
    [0x0024,0x0028,"StimulusPresentationTime","FL"],
    [0x0024,0x0032,"FixationSequence","SQ"],
    [0x0024,0x0033,"FixationMonitoringCodeSequence","SQ"],
    [0x0024,0x0034,"VisualFieldCatchTrialSequence","SQ"],
    [0x0024,0x0035,"FixationCheckedQuantity","US"],
    [0x0024,0x0036,"PatientNotProperlyFixatedQuantity","US"],
    [0x0024,0x0037,"PresentedVisualStimuliDataFlag","CS"],
    [0x0024,0x0038,"NumberOfVisualStimuli","US"],
    [0x0024,0x0039,"ExcessiveFixationLossesDataFlag","CS"],
    [0x0024,0x0040,"ExcessiveFixationLosses","CS"],
    [0x0024,0x0042,"StimuliRetestingQuantity","US"],
    [0x0024,0x0044,"CommentsOnPatientPerformanceOfVisualField","LT"],
    [0x0024,0x0045,"FalseNegativesEstimateFlag","CS"],
    [0x0024,0x0046,"FalseNegativesEstimate","FL"],
    [0x0024,0x0048,"NegativeCatchTrialsQuantity","US"],
    [0x0024,0x0050,"FalseNegativesQuantity","US"],
    [0x0024,0x0051,"ExcessiveFalseNegativesDataFlag","CS"],
    [0x0024,0x0052,"ExcessiveFalseNegatives","CS"],
    [0x0024,0x0053,"FalsePositivesEstimateFlag","CS"],
    [0x0024,0x0054,"FalsePositivesEstimate","FL"],
    [0x0024,0x0055,"CatchTrialsDataFlag","CS"],
    [0x0024,0x0056,"PositiveCatchTrialsQuantity","US"],
    [0x0024,0x0057,"TestPointNormalsDataFlag","CS"],
    [0x0024,0x0058,"TestPointNormalsSequence","SQ"],
    [0x0024,0x0059,"GlobalDeviationProbabilityNormalsFlag","CS"],
    [0x0024,0x0060,"FalsePositivesQuantity","US"],
    [0x0024,0x0061,"ExcessiveFalsePositivesDataFlag","CS"],
    [0x0024,0x0062,"ExcessiveFalsePositives","CS"],
    [0x0024,0x0063,"VisualFieldTestNormalsFlag","CS"],
    [0x0024,0x0064,"ResultsNormalsSequence","SQ"],
    [0x0024,0x0065,"AgeCorrectedSensitivityDeviationAlgorithmSequence","SQ"],
    [0x0024,0x0066,"GlobalDeviationFromNormal","FL"],
    [0x0024,0x0067,"GeneralizedDefectSensitivityDeviationAlgorithmSequence","SQ"],
    [0x0024,0x0068,"LocalizedDeviationfromNormal","FL"],
    [0x0024,0x0069,"PatientReliabilityIndicator","LO"],
    [0x0024,0x0070,"VisualFieldMeanSensitivity","FL"],
    [0x0024,0x0071,"GlobalDeviationProbability","FL"],
    [0x0024,0x0072,"LocalDeviationProbabilityNormalsFlag","CS"],
    [0x0024,0x0073,"LocalizedDeviationProbability","FL"],
    [0x0024,0x0074,"ShortTermFluctuationCalculated","CS"],
    [0x0024,0x0075,"ShortTermFluctuation","FL"],
    [0x0024,0x0076,"ShortTermFluctuationProbabilityCalculated","CS"],
    [0x0024,0x0077,"ShortTermFluctuationProbability","FL"],
    [0x0024,0x0078,"CorrectedLocalizedDeviationFromNormalCalculated","CS"],
    [0x0024,0x0079,"CorrectedLocalizedDeviationFromNormal","FL"],
    [0x0024,0x0080,"CorrectedLocalizedDeviationFromNormalProbabilityCalculated","CS"],
    [0x0024,0x0081,"CorrectedLocalizedDeviationFromNormalProbability","FL"],
    [0x0024,0x0083,"GlobalDeviationProbabilitySequence","SQ"],
    [0x0024,0x0085,"LocalizedDeviationProbabilitySequence","SQ"],
    [0x0024,0x0086,"FovealSensitivityMeasured","CS"],
    [0x0024,0x0087,"FovealSensitivity","FL"],
    [0x0024,0x0088,"VisualFieldTestDuration","FL"],
    [0x0024,0x0089,"VisualFieldTestPointSequence","SQ"],
    [0x0024,0x0090,"VisualFieldTestPointXCoordinate","FL"],
    [0x0024,0x0091,"VisualFieldTestPointYCoordinate","FL"],
    [0x0024,0x0092,"AgeCorrectedSensitivityDeviationValue","FL"],
    [0x0024,0x0093,"StimulusResults","CS"],
    [0x0024,0x0094,"SensitivityValue","FL"],
    [0x0024,0x0095,"RetestStimulusSeen","CS"],
    [0x0024,0x0096,"RetestSensitivityValue","FL"],
    [0x0024,0x0097,"VisualFieldTestPointNormalsSequence","SQ"],
    [0x0024,0x0098,"QuantifiedDefect","FL"],
    [0x0024,0x0100,"AgeCorrectedSensitivityDeviationProbabilityValue","FL"],
    [0x0024,0x0102,"GeneralizedDefectCorrectedSensitivityDeviationFlag ","CS"],
    [0x0024,0x0103,"GeneralizedDefectCorrectedSensitivityDeviationValue ","FL"],
    [0x0024,0x0104,"GeneralizedDefectCorrectedSensitivityDeviationProbabilityValue","FL"],
    [0x0024,0x0105,"MinimumSensitivityValue","FL "],
    [0x0024,0x0106,"BlindSpotLocalized","CS"],
    [0x0024,0x0107,"BlindSpotXCoordinate","FL"],
    [0x0024,0x0108,"BlindSpotYCoordinate ","FL"],
    [0x0024,0x0110,"VisualAcuityMeasurementSequence","SQ"],
    [0x0024,0x0112,"RefractiveParametersUsedOnPatientSequence","SQ"],
    [0x0024,0x0113,"MeasurementLaterality","CS"],
    [0x0024,0x0114,"OphthalmicPatientClinicalInformationLeftEyeSequence","SQ"],
    [0x0024,0x0115,"OphthalmicPatientClinicalInformationRightEyeSequence","SQ"],
    [0x0024,0x0117,"FovealPointNormativeDataFlag","CS"],
    [0x0024,0x0118,"FovealPointProbabilityValue","FL"],
    [0x0024,0x0120,"ScreeningBaselineMeasured","CS"],
    [0x0024,0x0122,"ScreeningBaselineMeasuredSequence","SQ"],
    [0x0024,0x0124,"ScreeningBaselineType","CS"],
    [0x0024,0x0126,"ScreeningBaselineValue","FL"],
    [0x0024,0x0202,"AlgorithmSource","LO"],
    [0x0024,0x0306,"DataSetName","LO"],
    [0x0024,0x0307,"DataSetVersion","LO"],
    [0x0024,0x0308,"DataSetSource","LO"],
    [0x0024,0x0309,"DataSetDescription","LO"],
    [0x0024,0x0317,"VisualFieldTestReliabilityGlobalIndexSequence","SQ"],
    [0x0024,0x0320,"VisualFieldGlobalResultsIndexSequence","SQ"],
    [0x0024,0x0325,"DataObservationSequence","SQ"],
    [0x0024,0x0338,"IndexNormalsFlag","CS"],
    [0x0024,0x0341,"IndexProbability","FL"],
    [0x0024,0x0344,"IndexProbabilitySequence","SQ"],
    [0x0028,0x0002,"SamplesPerPixel","US"],
    [0x0028,0x0003,"SamplesPerPixelUsed","US"],
    [0x0028,0x0004,"PhotometricInterpretation","CS"],
    [0x0028,0x0005,"ImageDimensions","US"],
    [0x0028,0x0006,"PlanarConfiguration","US"],
    [0x0028,0x0008,"NumberOfFrames","IS"],
    [0x0028,0x0009,"FrameIncrementPointer","AT"],
    [0x0028,0x000A,"FrameDimensionPointer","AT"],
    [0x0028,0x0010,"Rows","US"],
    [0x0028,0x0011,"Columns","US"],
    [0x0028,0x0012,"Planes","US"],
    [0x0028,0x0014,"UltrasoundColorDataPresent","US"],
    [0x0028,0x0030,"PixelSpacing","DS"],
    [0x0028,0x0031,"ZoomFactor","DS"],
    [0x0028,0x0032,"ZoomCenter","DS"],
    [0x0028,0x0034,"PixelAspectRatio","IS"],
    [0x0028,0x0040,"ImageFormat","CS"],
    [0x0028,0x0050,"ManipulatedImage","LO"],
    [0x0028,0x0051,"CorrectedImage","CS"],
    [0x0028,0x005F,"CompressionRecognitionCode","LO"],
    [0x0028,0x0060,"CompressionCode","CS"],
    [0x0028,0x0061,"CompressionOriginator","SH"],
    [0x0028,0x0062,"CompressionLabel","LO"],
    [0x0028,0x0063,"CompressionDescription","SH"],
    [0x0028,0x0065,"CompressionSequence","CS"],
    [0x0028,0x0066,"CompressionStepPointers","AT"],
    [0x0028,0x0068,"RepeatInterval","US"],
    [0x0028,0x0069,"BitsGrouped","US"],
    [0x0028,0x0070,"PerimeterTable","US"],
    [0x0028,0x0071,"PerimeterValue","SS"],
    [0x0028,0x0080,"PredictorRows","US"],
    [0x0028,0x0081,"PredictorColumns","US"],
    [0x0028,0x0082,"PredictorConstants","US"],
    [0x0028,0x0090,"BlockedPixels","CS"],
    [0x0028,0x0091,"BlockRows","US"],
    [0x0028,0x0092,"BlockColumns","US"],
    [0x0028,0x0093,"RowOverlap","US"],
    [0x0028,0x0094,"ColumnOverlap","US"],
    [0x0028,0x0100,"BitsAllocated","US"],
    [0x0028,0x0101,"BitsStored","US"],
    [0x0028,0x0102,"HighBit","US"],
    [0x0028,0x0103,"PixelRepresentation","US"],
    [0x0028,0x0104,"SmallestValidPixelValue","SS"],
    [0x0028,0x0105,"LargestValidPixelValue","SS"],
    [0x0028,0x0106,"SmallestImagePixelValue","SS"],
    [0x0028,0x0107,"LargestImagePixelValue","SS"],
    [0x0028,0x0108,"SmallestPixelValueInSeries","SS"],
    [0x0028,0x0109,"LargestPixelValueInSeries","SS"],
    [0x0028,0x0110,"SmallestImagePixelValueInPlane","SS"],
    [0x0028,0x0111,"LargestImagePixelValueInPlane","SS"],
    [0x0028,0x0120,"PixelPaddingValue","SS"],
    [0x0028,0x0121,"PixelPaddingRangeLimit","SS"],
    [0x0028,0x0200,"ImageLocation","US"],
    [0x0028,0x0300,"QualityControlImage","CS"],
    [0x0028,0x0301,"BurnedInAnnotation","CS"],
    [0x0028,0x0302,"RecognizableVisualFeatures","CS"],
    [0x0028,0x0303,"LongitudinalTemporalInformationModified","CS"],
    [0x0028,0x0400,"TransformLabel","LO"],
    [0x0028,0x0401,"TransformVersionNumber","LO"],
    [0x0028,0x0402,"NumberOfTransformSteps","US"],
    [0x0028,0x0403,"SequenceOfCompressedData","LO"],
    [0x0028,0x0404,"DetailsOfCoefficients","AT"],
    [0x0028,0x0700,"DCTLabel","LO"],
    [0x0028,0x0701,"DataBlockDescription","CS"],
    [0x0028,0x0702,"DataBlock","AT"],
    [0x0028,0x0710,"NormalizationFactorFormat","US"],
    [0x0028,0x0720,"ZonalMapNumberFormat","US"],
    [0x0028,0x0721,"ZonalMapLocation","AT"],
    [0x0028,0x0722,"ZonalMapFormat","US"],
    [0x0028,0x0730,"AdaptiveMapFormat","US"],
    [0x0028,0x0740,"CodeNumberFormat","US"],
    [0x0028,0x0A02,"PixelSpacingCalibrationType","CS"],
    [0x0028,0x0A04,"PixelSpacingCalibrationDescription","LO"],
    [0x0028,0x1040,"PixelIntensityRelationship","CS"],
    [0x0028,0x1041,"PixelIntensityRelationshipSign","SS"],
    [0x0028,0x1050,"WindowCenter","DS"],
    [0x0028,0x1051,"WindowWidth","DS"],
    [0x0028,0x1052,"RescaleIntercept","DS"],
    [0x0028,0x1053,"RescaleSlope","DS"],
    [0x0028,0x1054,"RescaleType","LO"],
    [0x0028,0x1055,"WindowCenterWidthExplanation","LO"],
    [0x0028,0x1056,"VOILUTFunction","CS"],
    [0x0028,0x1080,"GrayScale","CS"],
    [0x0028,0x1090,"RecommendedViewingMode","CS"],
    [0x0028,0x1100,"GrayLookupTableDescriptor","SS"],
    [0x0028,0x1101,"RedPaletteColorLookupTableDescriptor","SS"],
    [0x0028,0x1102,"GreenPaletteColorLookupTableDescriptor","SS"],
    [0x0028,0x1103,"BluePaletteColorLookupTableDescriptor","SS"],
    [0x0028,0x1104,"AlphaPaletteColorLookupTableDescriptor","US"],
    [0x0028,0x1111,"LargeRedPaletteColorLookupTableDescriptor","SS"],
    [0x0028,0x1112,"LargeGreenPaletteColorLookupTableDescriptor","SS"],
    [0x0028,0x1113,"LargeBluePaletteColorLookupTableDescriptor","SS"],
    [0x0028,0x1199,"PaletteColorLookupTableUID","UI"],
    [0x0028,0x1200,"GrayLookupTableData","OW"],
    [0x0028,0x1201,"RedPaletteColorLookupTableData","OW"],
    [0x0028,0x1202,"GreenPaletteColorLookupTableData","OW"],
    [0x0028,0x1203,"BluePaletteColorLookupTableData","OW"],
    [0x0028,0x1204,"AlphaPaletteColorLookupTableData","OW"],
    [0x0028,0x1211,"LargeRedPaletteColorLookupTableData","OW"],
    [0x0028,0x1212,"LargeGreenPaletteColorLookupTableData","OW"],
    [0x0028,0x1213,"LargeBluePaletteColorLookupTableData","OW"],
    [0x0028,0x1214,"LargePaletteColorLookupTableUID","UI"],
    [0x0028,0x1221,"SegmentedRedPaletteColorLookupTableData","OW"],
    [0x0028,0x1222,"SegmentedGreenPaletteColorLookupTableData","OW"],
    [0x0028,0x1223,"SegmentedBluePaletteColorLookupTableData","OW"],
    [0x0028,0x1300,"BreastImplantPresent","CS"],
    [0x0028,0x1350,"PartialView","CS"],
    [0x0028,0x1351,"PartialViewDescription","ST"],
    [0x0028,0x1352,"PartialViewCodeSequence","SQ"],
    [0x0028,0x135A,"SpatialLocationsPreserved","CS"],
    [0x0028,0x1401,"DataFrameAssignmentSequence","SQ"],
    [0x0028,0x1402,"DataPathAssignment","CS"],
    [0x0028,0x1403,"BitsMappedToColorLookupTable","US"],
    [0x0028,0x1404,"BlendingLUT1Sequence","SQ"],
    [0x0028,0x1405,"BlendingLUT1TransferFunction","CS"],
    [0x0028,0x1406,"BlendingWeightConstant","FD"],
    [0x0028,0x1407,"BlendingLookupTableDescriptor","US"],
    [0x0028,0x1408,"BlendingLookupTableData","OW"],
    [0x0028,0x140B,"EnhancedPaletteColorLookupTableSequence","SQ"],
    [0x0028,0x140C,"BlendingLUT2Sequence","SQ"],
    [0x0028,0x140D,"BlendingLUT2TransferFunction","CS"],
    [0x0028,0x140E,"DataPathID","CS"],
    [0x0028,0x140F,"RGBLUTTransferFunction","CS"],
    [0x0028,0x1410,"AlphaLUTTransferFunction","CS"],
    [0x0028,0x2000,"ICCProfile","OB"],
    [0x0028,0x2110,"LossyImageCompression","CS"],
    [0x0028,0x2112,"LossyImageCompressionRatio","DS"],
    [0x0028,0x2114,"LossyImageCompressionMethod","CS"],
    [0x0028,0x3000,"ModalityLUTSequence","SQ"],
    [0x0028,0x3002,"LUTDescriptor","SS"],
    [0x0028,0x3003,"LUTExplanation","LO"],
    [0x0028,0x3004,"ModalityLUTType","LO"],
    [0x0028,0x3006,"LUTData","OW"],
    [0x0028,0x3010,"VOILUTSequence","SQ"],
    [0x0028,0x3110,"SoftcopyVOILUTSequence","SQ"],
    [0x0028,0x4000,"ImagePresentationComments","LT"],
    [0x0028,0x5000,"BiPlaneAcquisitionSequence","SQ"],
    [0x0028,0x6010,"RepresentativeFrameNumber","US"],
    [0x0028,0x6020,"FrameNumbersOfInterest","US"],
    [0x0028,0x6022,"FrameOfInterestDescription","LO"],
    [0x0028,0x6023,"FrameOfInterestType","CS"],
    [0x0028,0x6030,"MaskPointers","US"],
    [0x0028,0x6040,"RWavePointer","US"],
    [0x0028,0x6100,"MaskSubtractionSequence","SQ"],
    [0x0028,0x6101,"MaskOperation","CS"],
    [0x0028,0x6102,"ApplicableFrameRange","US"],
    [0x0028,0x6110,"MaskFrameNumbers","US"],
    [0x0028,0x6112,"ContrastFrameAveraging","US"],
    [0x0028,0x6114,"MaskSubPixelShift","FL"],
    [0x0028,0x6120,"TIDOffset","SS"],
    [0x0028,0x6190,"MaskOperationExplanation","ST"],
    [0x0028,0x7FE0,"PixelDataProviderURL","UT"],
    [0x0028,0x9001,"DataPointRows","UL"],
    [0x0028,0x9002,"DataPointColumns","UL"],
    [0x0028,0x9003,"SignalDomainColumns","CS"],
    [0x0028,0x9099,"LargestMonochromePixelValue","US"],
    [0x0028,0x9108,"DataRepresentation","CS"],
    [0x0028,0x9110,"PixelMeasuresSequence","SQ"],
    [0x0028,0x9132,"FrameVOILUTSequence","SQ"],
    [0x0028,0x9145,"PixelValueTransformationSequence","SQ"],
    [0x0028,0x9235,"SignalDomainRows","CS"],
    [0x0028,0x9411,"DisplayFilterPercentage","FL"],
    [0x0028,0x9415,"FramePixelShiftSequence","SQ"],
    [0x0028,0x9416,"SubtractionItemID","US"],
    [0x0028,0x9422,"PixelIntensityRelationshipLUTSequence","SQ"],
    [0x0028,0x9443,"FramePixelDataPropertiesSequence","SQ"],
    [0x0028,0x9444,"GeometricalProperties","CS"],
    [0x0028,0x9445,"GeometricMaximumDistortion","FL"],
    [0x0028,0x9446,"ImageProcessingApplied","CS"],
    [0x0028,0x9454,"MaskSelectionMode","CS"],
    [0x0028,0x9474,"LUTFunction","CS"],
    [0x0028,0x9478,"MaskVisibilityPercentage","FL"],
    [0x0028,0x9501,"PixelShiftSequence","SQ"],
    [0x0028,0x9502,"RegionPixelShiftSequence","SQ"],
    [0x0028,0x9503,"VerticesOfTheRegion","SS"],
    [0x0028,0x9505,"MultiFramePresentationSequence","SQ"],
    [0x0028,0x9506,"PixelShiftFrameRange","US"],
    [0x0028,0x9507,"LUTFrameRange","US"],
    [0x0028,0x9520,"ImageToEquipmentMappingMatrix","DS"],
    [0x0028,0x9537,"EquipmentCoordinateSystemIdentification","CS"],
    [0x0032,0x000A,"StudyStatusID","CS"],
    [0x0032,0x000C,"StudyPriorityID","CS"],
    [0x0032,0x0012,"StudyIDIssuer","LO"],
    [0x0032,0x0032,"StudyVerifiedDate","DA"],
    [0x0032,0x0033,"StudyVerifiedTime","TM"],
    [0x0032,0x0034,"StudyReadDate","DA"],
    [0x0032,0x0035,"StudyReadTime","TM"],
    [0x0032,0x1000,"ScheduledStudyStartDate","DA"],
    [0x0032,0x1001,"ScheduledStudyStartTime","TM"],
    [0x0032,0x1010,"ScheduledStudyStopDate","DA"],
    [0x0032,0x1011,"ScheduledStudyStopTime","TM"],
    [0x0032,0x1020,"ScheduledStudyLocation","LO"],
    [0x0032,0x1021,"ScheduledStudyLocationAETitle","AE"],
    [0x0032,0x1030,"ReasonForStudy","LO"],
    [0x0032,0x1031,"RequestingPhysicianIdentificationSequence","SQ"],
    [0x0032,0x1032,"RequestingPhysician","PN"],
    [0x0032,0x1033,"RequestingService","LO"],
    [0x0032,0x1034,"RequestingServiceCodeSequence","SQ"],
    [0x0032,0x1040,"StudyArrivalDate","DA"],
    [0x0032,0x1041,"StudyArrivalTime","TM"],
    [0x0032,0x1050,"StudyCompletionDate","DA"],
    [0x0032,0x1051,"StudyCompletionTime","TM"],
    [0x0032,0x1055,"StudyComponentStatusID","CS"],
    [0x0032,0x1060,"RequestedProcedureDescription","LO"],
    [0x0032,0x1064,"RequestedProcedureCodeSequence","SQ"],
    [0x0032,0x1070,"RequestedContrastAgent","LO"],
    [0x0032,0x4000,"StudyComments","LT"],
    [0x0038,0x0004,"ReferencedPatientAliasSequence","SQ"],
    [0x0038,0x0008,"VisitStatusID","CS"],
    [0x0038,0x0010,"AdmissionID","LO"],
    [0x0038,0x0011,"IssuerOfAdmissionID","LO"],
    [0x0038,0x0014,"IssuerOfAdmissionIDSequence","SQ"],
    [0x0038,0x0016,"RouteOfAdmissions","LO"],
    [0x0038,0x001A,"ScheduledAdmissionDate","DA"],
    [0x0038,0x001B,"ScheduledAdmissionTime","TM"],
    [0x0038,0x001C,"ScheduledDischargeDate","DA"],
    [0x0038,0x001D,"ScheduledDischargeTime","TM"],
    [0x0038,0x001E,"ScheduledPatientInstitutionResidence","LO"],
    [0x0038,0x0020,"AdmittingDate","DA"],
    [0x0038,0x0021,"AdmittingTime","TM"],
    [0x0038,0x0030,"DischargeDate","DA"],
    [0x0038,0x0032,"DischargeTime","TM"],
    [0x0038,0x0040,"DischargeDiagnosisDescription","LO"],
    [0x0038,0x0044,"DischargeDiagnosisCodeSequence","SQ"],
    [0x0038,0x0050,"SpecialNeeds","LO"],
    [0x0038,0x0060,"ServiceEpisodeID","LO"],
    [0x0038,0x0061,"IssuerOfServiceEpisodeID","LO"],
    [0x0038,0x0062,"ServiceEpisodeDescription","LO"],
    [0x0038,0x0064,"IssuerOfServiceEpisodeIDSequence","SQ"],
    [0x0038,0x0100,"PertinentDocumentsSequence","SQ"],
    [0x0038,0x0300,"CurrentPatientLocation","LO"],
    [0x0038,0x0400,"PatientInstitutionResidence","LO"],
    [0x0038,0x0500,"PatientState","LO"],
    [0x0038,0x0502,"PatientClinicalTrialParticipationSequence","SQ"],
    [0x0038,0x4000,"VisitComments","LT"],
    [0x003A,0x0004,"WaveformOriginality","CS"],
    [0x003A,0x0005,"NumberOfWaveformChannels","US"],
    [0x003A,0x0010,"NumberOfWaveformSamples","UL"],
    [0x003A,0x001A,"SamplingFrequency","DS"],
    [0x003A,0x0020,"MultiplexGroupLabel","SH"],
    [0x003A,0x0200,"ChannelDefinitionSequence","SQ"],
    [0x003A,0x0202,"WaveformChannelNumber","IS"],
    [0x003A,0x0203,"ChannelLabel","SH"],
    [0x003A,0x0205,"ChannelStatus","CS"],
    [0x003A,0x0208,"ChannelSourceSequence","SQ"],
    [0x003A,0x0209,"ChannelSourceModifiersSequence","SQ"],
    [0x003A,0x020A,"SourceWaveformSequence","SQ"],
    [0x003A,0x020C,"ChannelDerivationDescription","LO"],
    [0x003A,0x0210,"ChannelSensitivity","DS"],
    [0x003A,0x0211,"ChannelSensitivityUnitsSequence","SQ"],
    [0x003A,0x0212,"ChannelSensitivityCorrectionFactor","DS"],
    [0x003A,0x0213,"ChannelBaseline","DS"],
    [0x003A,0x0214,"ChannelTimeSkew","DS"],
    [0x003A,0x0215,"ChannelSampleSkew","DS"],
    [0x003A,0x0218,"ChannelOffset","DS"],
    [0x003A,0x021A,"WaveformBitsStored","US"],
    [0x003A,0x0220,"FilterLowFrequency","DS"],
    [0x003A,0x0221,"FilterHighFrequency","DS"],
    [0x003A,0x0222,"NotchFilterFrequency","DS"],
    [0x003A,0x0223,"NotchFilterBandwidth","DS"],
    [0x003A,0x0230,"WaveformDataDisplayScale","FL"],
    [0x003A,0x0231,"WaveformDisplayBackgroundCIELabValue","US"],
    [0x003A,0x0240,"WaveformPresentationGroupSequence","SQ"],
    [0x003A,0x0241,"PresentationGroupNumber","US"],
    [0x003A,0x0242,"ChannelDisplaySequence","SQ"],
    [0x003A,0x0244,"ChannelRecommendedDisplayCIELabValue","US"],
    [0x003A,0x0245,"ChannelPosition","FL"],
    [0x003A,0x0246,"DisplayShadingFlag","CS"],
    [0x003A,0x0247,"FractionalChannelDisplayScale","FL"],
    [0x003A,0x0248,"AbsoluteChannelDisplayScale","FL"],
    [0x003A,0x0300,"MultiplexedAudioChannelsDescriptionCodeSequence","SQ"],
    [0x003A,0x0301,"ChannelIdentificationCode","IS"],
    [0x003A,0x0302,"ChannelMode","CS"],
    [0x0040,0x0001,"ScheduledStationAETitle","AE"],
    [0x0040,0x0002,"ScheduledProcedureStepStartDate","DA"],
    [0x0040,0x0003,"ScheduledProcedureStepStartTime","TM"],
    [0x0040,0x0004,"ScheduledProcedureStepEndDate","DA"],
    [0x0040,0x0005,"ScheduledProcedureStepEndTime","TM"],
    [0x0040,0x0006,"ScheduledPerformingPhysicianName","PN"],
    [0x0040,0x0007,"ScheduledProcedureStepDescription","LO"],
    [0x0040,0x0008,"ScheduledProtocolCodeSequence","SQ"],
    [0x0040,0x0009,"ScheduledProcedureStepID","SH"],
    [0x0040,0x000A,"StageCodeSequence","SQ"],
    [0x0040,0x000B,"ScheduledPerformingPhysicianIdentificationSequence","SQ"],
    [0x0040,0x0010,"ScheduledStationName","SH"],
    [0x0040,0x0011,"ScheduledProcedureStepLocation","SH"],
    [0x0040,0x0012,"PreMedication","LO"],
    [0x0040,0x0020,"ScheduledProcedureStepStatus","CS"],
    [0x0040,0x0026,"OrderPlacerIdentifierSequence","SQ"],
    [0x0040,0x0027,"OrderFillerIdentifierSequence","SQ"],
    [0x0040,0x0031,"LocalNamespaceEntityID","UT"],
    [0x0040,0x0032,"UniversalEntityID","UT"],
    [0x0040,0x0033,"UniversalEntityIDType","CS"],
    [0x0040,0x0035,"IdentifierTypeCode","CS"],
    [0x0040,0x0036,"AssigningFacilitySequence","SQ"],
    [0x0040,0x0039,"AssigningJurisdictionCodeSequence","SQ"],
    [0x0040,0x003A,"AssigningAgencyOrDepartmentCodeSequence","SQ"],
    [0x0040,0x0100,"ScheduledProcedureStepSequence","SQ"],
    [0x0040,0x0220,"ReferencedNonImageCompositeSOPInstanceSequence","SQ"],
    [0x0040,0x0241,"PerformedStationAETitle","AE"],
    [0x0040,0x0242,"PerformedStationName","SH"],
    [0x0040,0x0243,"PerformedLocation","SH"],
    [0x0040,0x0244,"PerformedProcedureStepStartDate","DA"],
    [0x0040,0x0245,"PerformedProcedureStepStartTime","TM"],
    [0x0040,0x0250,"PerformedProcedureStepEndDate","DA"],
    [0x0040,0x0251,"PerformedProcedureStepEndTime","TM"],
    [0x0040,0x0252,"PerformedProcedureStepStatus","CS"],
    [0x0040,0x0253,"PerformedProcedureStepID","SH"],
    [0x0040,0x0254,"PerformedProcedureStepDescription","LO"],
    [0x0040,0x0255,"PerformedProcedureTypeDescription","LO"],
    [0x0040,0x0260,"PerformedProtocolCodeSequence","SQ"],
    [0x0040,0x0261,"PerformedProtocolType","CS"],
    [0x0040,0x0270,"ScheduledStepAttributesSequence","SQ"],
    [0x0040,0x0275,"RequestAttributesSequence","SQ"],
    [0x0040,0x0280,"CommentsOnThePerformedProcedureStep","ST"],
    [0x0040,0x0281,"PerformedProcedureStepDiscontinuationReasonCodeSequence","SQ"],
    [0x0040,0x0293,"QuantitySequence","SQ"],
    [0x0040,0x0294,"Quantity","DS"],
    [0x0040,0x0295,"MeasuringUnitsSequence","SQ"],
    [0x0040,0x0296,"BillingItemSequence","SQ"],
    [0x0040,0x0300,"TotalTimeOfFluoroscopy","US"],
    [0x0040,0x0301,"TotalNumberOfExposures","US"],
    [0x0040,0x0302,"EntranceDose","US"],
    [0x0040,0x0303,"ExposedArea","US"],
    [0x0040,0x0306,"DistanceSourceToEntrance","DS"],
    [0x0040,0x0307,"DistanceSourceToSupport","DS"],
    [0x0040,0x030E,"ExposureDoseSequence","SQ"],
    [0x0040,0x0310,"CommentsOnRadiationDose","ST"],
    [0x0040,0x0312,"XRayOutput","DS"],
    [0x0040,0x0314,"HalfValueLayer","DS"],
    [0x0040,0x0316,"OrganDose","DS"],
    [0x0040,0x0318,"OrganExposed","CS"],
    [0x0040,0x0320,"BillingProcedureStepSequence","SQ"],
    [0x0040,0x0321,"FilmConsumptionSequence","SQ"],
    [0x0040,0x0324,"BillingSuppliesAndDevicesSequence","SQ"],
    [0x0040,0x0330,"ReferencedProcedureStepSequence","SQ"],
    [0x0040,0x0340,"PerformedSeriesSequence","SQ"],
    [0x0040,0x0400,"CommentsOnTheScheduledProcedureStep","LT"],
    [0x0040,0x0440,"ProtocolContextSequence","SQ"],
    [0x0040,0x0441,"ContentItemModifierSequence","SQ"],
    [0x0040,0x0500,"ScheduledSpecimenSequence","SQ"],
    [0x0040,0x050A,"SpecimenAccessionNumber","LO"],
    [0x0040,0x0512,"ContainerIdentifier","LO"],
    [0x0040,0x0513,"IssuerOfTheContainerIdentifierSequence","SQ"],
    [0x0040,0x0515,"AlternateContainerIdentifierSequence","SQ"],
    [0x0040,0x0518,"ContainerTypeCodeSequence","SQ"],
    [0x0040,0x051A,"ContainerDescription","LO"],
    [0x0040,0x0520,"ContainerComponentSequence","SQ"],
    [0x0040,0x0550,"SpecimenSequence","SQ"],
    [0x0040,0x0551,"SpecimenIdentifier","LO"],
    [0x0040,0x0552,"SpecimenDescriptionSequenceTrial","SQ"],
    [0x0040,0x0553,"SpecimenDescriptionTrial","ST"],
    [0x0040,0x0554,"SpecimenUID","UI"],
    [0x0040,0x0555,"AcquisitionContextSequence","SQ"],
    [0x0040,0x0556,"AcquisitionContextDescription","ST"],
    [0x0040,0x059A,"SpecimenTypeCodeSequence","SQ"],
    [0x0040,0x0560,"SpecimenDescriptionSequence","SQ"],
    [0x0040,0x0562,"IssuerOfTheSpecimenIdentifierSequence","SQ"],
    [0x0040,0x0600,"SpecimenShortDescription","LO"],
    [0x0040,0x0602,"SpecimenDetailedDescription","UT"],
    [0x0040,0x0610,"SpecimenPreparationSequence","SQ"],
    [0x0040,0x0612,"SpecimenPreparationStepContentItemSequence","SQ"],
    [0x0040,0x0620,"SpecimenLocalizationContentItemSequence","SQ"],
    [0x0040,0x06FA,"SlideIdentifier","LO"],
    [0x0040,0x071A,"ImageCenterPointCoordinatesSequence","SQ"],
    [0x0040,0x072A,"XOffsetInSlideCoordinateSystem","DS"],
    [0x0040,0x073A,"YOffsetInSlideCoordinateSystem","DS"],
    [0x0040,0x074A,"ZOffsetInSlideCoordinateSystem","DS"],
    [0x0040,0x08D8,"PixelSpacingSequence","SQ"],
    [0x0040,0x08DA,"CoordinateSystemAxisCodeSequence","SQ"],
    [0x0040,0x08EA,"MeasurementUnitsCodeSequence","SQ"],
    [0x0040,0x09F8,"VitalStainCodeSequenceTrial","SQ"],
    [0x0040,0x1001,"RequestedProcedureID","SH"],
    [0x0040,0x1002,"ReasonForTheRequestedProcedure","LO"],
    [0x0040,0x1003,"RequestedProcedurePriority","SH"],
    [0x0040,0x1004,"PatientTransportArrangements","LO"],
    [0x0040,0x1005,"RequestedProcedureLocation","LO"],
    [0x0040,0x1006,"PlacerOrderNumberProcedure","SH"],
    [0x0040,0x1007,"FillerOrderNumberProcedure","SH"],
    [0x0040,0x1008,"ConfidentialityCode","LO"],
    [0x0040,0x1009,"ReportingPriority","SH"],
    [0x0040,0x100A,"ReasonForRequestedProcedureCodeSequence","SQ"],
    [0x0040,0x1010,"NamesOfIntendedRecipientsOfResults","PN"],
    [0x0040,0x1011,"IntendedRecipientsOfResultsIdentificationSequence","SQ"],
    [0x0040,0x1012,"ReasonForPerformedProcedureCodeSequence","SQ"],
    [0x0040,0x1060,"RequestedProcedureDescriptionTrial","LO"],
    [0x0040,0x1101,"PersonIdentificationCodeSequence","SQ"],
    [0x0040,0x1102,"PersonAddress","ST"],
    [0x0040,0x1103,"PersonTelephoneNumbers","LO"],
    [0x0040,0x1400,"RequestedProcedureComments","LT"],
    [0x0040,0x2001,"ReasonForTheImagingServiceRequest","LO"],
    [0x0040,0x2004,"IssueDateOfImagingServiceRequest","DA"],
    [0x0040,0x2005,"IssueTimeOfImagingServiceRequest","TM"],
    [0x0040,0x2006,"PlacerOrderNumberImagingServiceRequestRetired","SH"],
    [0x0040,0x2007,"FillerOrderNumberImagingServiceRequestRetired","SH"],
    [0x0040,0x2008,"OrderEnteredBy","PN"],
    [0x0040,0x2009,"OrderEntererLocation","SH"],
    [0x0040,0x2010,"OrderCallbackPhoneNumber","SH"],
    [0x0040,0x2016,"PlacerOrderNumberImagingServiceRequest","LO"],
    [0x0040,0x2017,"FillerOrderNumberImagingServiceRequest","LO"],
    [0x0040,0x2400,"ImagingServiceRequestComments","LT"],
    [0x0040,0x3001,"ConfidentialityConstraintOnPatientDataDescription","LO"],
    [0x0040,0x4001,"GeneralPurposeScheduledProcedureStepStatus","CS"],
    [0x0040,0x4002,"GeneralPurposePerformedProcedureStepStatus","CS"],
    [0x0040,0x4003,"GeneralPurposeScheduledProcedureStepPriority","CS"],
    [0x0040,0x4004,"ScheduledProcessingApplicationsCodeSequence","SQ"],
    [0x0040,0x4005,"ScheduledProcedureStepStartDateTime","DT"],
    [0x0040,0x4006,"MultipleCopiesFlag","CS"],
    [0x0040,0x4007,"PerformedProcessingApplicationsCodeSequence","SQ"],
    [0x0040,0x4009,"HumanPerformerCodeSequence","SQ"],
    [0x0040,0x4010,"ScheduledProcedureStepModificationDateTime","DT"],
    [0x0040,0x4011,"ExpectedCompletionDateTime","DT"],
    [0x0040,0x4015,"ResultingGeneralPurposePerformedProcedureStepsSequence","SQ"],
    [0x0040,0x4016,"ReferencedGeneralPurposeScheduledProcedureStepSequence","SQ"],
    [0x0040,0x4018,"ScheduledWorkitemCodeSequence","SQ"],
    [0x0040,0x4019,"PerformedWorkitemCodeSequence","SQ"],
    [0x0040,0x4020,"InputAvailabilityFlag","CS"],
    [0x0040,0x4021,"InputInformationSequence","SQ"],
    [0x0040,0x4022,"RelevantInformationSequence","SQ"],
    [0x0040,0x4023,"ReferencedGeneralPurposeScheduledProcedureStepTransactionUID","UI"],
    [0x0040,0x4025,"ScheduledStationNameCodeSequence","SQ"],
    [0x0040,0x4026,"ScheduledStationClassCodeSequence","SQ"],
    [0x0040,0x4027,"ScheduledStationGeographicLocationCodeSequence","SQ"],
    [0x0040,0x4028,"PerformedStationNameCodeSequence","SQ"],
    [0x0040,0x4029,"PerformedStationClassCodeSequence","SQ"],
    [0x0040,0x4030,"PerformedStationGeographicLocationCodeSequence","SQ"],
    [0x0040,0x4031,"RequestedSubsequentWorkitemCodeSequence","SQ"],
    [0x0040,0x4032,"NonDICOMOutputCodeSequence","SQ"],
    [0x0040,0x4033,"OutputInformationSequence","SQ"],
    [0x0040,0x4034,"ScheduledHumanPerformersSequence","SQ"],
    [0x0040,0x4035,"ActualHumanPerformersSequence","SQ"],
    [0x0040,0x4036,"HumanPerformerOrganization","LO"],
    [0x0040,0x4037,"HumanPerformerName","PN"],
    [0x0040,0x4040,"RawDataHandling","CS"],
    [0x0040,0x4041,"InputReadinessState","CS"],
    [0x0040,0x4050,"PerformedProcedureStepStartDateTime","DT"],
    [0x0040,0x4051,"PerformedProcedureStepEndDateTime","DT"],
    [0x0040,0x4052,"ProcedureStepCancellationDateTime","DT"],
    [0x0040,0x8302,"EntranceDoseInmGy","DS"],
    [0x0040,0x9094,"ReferencedImageRealWorldValueMappingSequence","SQ"],
    [0x0040,0x9096,"RealWorldValueMappingSequence","SQ"],
    [0x0040,0x9098,"PixelValueMappingCodeSequence","SQ"],
    [0x0040,0x9210,"LUTLabel","SH"],
    [0x0040,0x9211,"RealWorldValueLastValueMapped","SS"],
    [0x0040,0x9212,"RealWorldValueLUTData","FD"],
    [0x0040,0x9216,"RealWorldValueFirstValueMapped","SS"],
    [0x0040,0x9224,"RealWorldValueIntercept","FD"],
    [0x0040,0x9225,"RealWorldValueSlope","FD"],
    [0x0040,0xA007,"FindingsFlagTrial","CS"],
    [0x0040,0xA010,"RelationshipType","CS"],
    [0x0040,0xA020,"FindingsSequenceTrial","SQ"],
    [0x0040,0xA021,"FindingsGroupUIDTrial","UI"],
    [0x0040,0xA022,"ReferencedFindingsGroupUIDTrial","UI"],
    [0x0040,0xA023,"FindingsGroupRecordingDateTrial","DA"],
    [0x0040,0xA024,"FindingsGroupRecordingTimeTrial","TM"],
    [0x0040,0xA026,"FindingsSourceCategoryCodeSequenceTrial","SQ"],
    [0x0040,0xA027,"VerifyingOrganization","LO"],
    [0x0040,0xA028,"DocumentingOrganizationIdentifierCodeSequenceTrial","SQ"],
    [0x0040,0xA030,"VerificationDateTime","DT"],
    [0x0040,0xA032,"ObservationDateTime","DT"],
    [0x0040,0xA040,"ValueType","CS"],
    [0x0040,0xA043,"ConceptNameCodeSequence","SQ"],
    [0x0040,0xA047,"MeasurementPrecisionDescriptionTrial","LO"],
    [0x0040,0xA050,"ContinuityOfContent","CS"],
    [0x0040,0xA057,"UrgencyOrPriorityAlertsTrial","CS"],
    [0x0040,0xA060,"SequencingIndicatorTrial","LO"],
    [0x0040,0xA066,"DocumentIdentifierCodeSequenceTrial","SQ"],
    [0x0040,0xA067,"DocumentAuthorTrial","PN"],
    [0x0040,0xA068,"DocumentAuthorIdentifierCodeSequenceTrial","SQ"],
    [0x0040,0xA070,"IdentifierCodeSequenceTrial","SQ"],
    [0x0040,0xA073,"VerifyingObserverSequence","SQ"],
    [0x0040,0xA074,"ObjectBinaryIdentifierTrial","OB"],
    [0x0040,0xA075,"VerifyingObserverName","PN"],
    [0x0040,0xA076,"DocumentingObserverIdentifierCodeSequenceTrial","SQ"],
    [0x0040,0xA078,"AuthorObserverSequence","SQ"],
    [0x0040,0xA07A,"ParticipantSequence","SQ"],
    [0x0040,0xA07C,"CustodialOrganizationSequence","SQ"],
    [0x0040,0xA080,"ParticipationType","CS"],
    [0x0040,0xA082,"ParticipationDateTime","DT"],
    [0x0040,0xA084,"ObserverType","CS"],
    [0x0040,0xA085,"ProcedureIdentifierCodeSequenceTrial","SQ"],
    [0x0040,0xA088,"VerifyingObserverIdentificationCodeSequence","SQ"],
    [0x0040,0xA089,"ObjectDirectoryBinaryIdentifierTrial","OB"],
    [0x0040,0xA090,"EquivalentCDADocumentSequence","SQ"],
    [0x0040,0xA0B0,"ReferencedWaveformChannels","US"],
    [0x0040,0xA110,"DateOfDocumentOrVerbalTransactionTrial","DA"],
    [0x0040,0xA112,"TimeOfDocumentCreationOrVerbalTransactionTrial","TM"],
    [0x0040,0xA120,"DateTime","DT"],
    [0x0040,0xA121,"Date","DA"],
    [0x0040,0xA122,"Time","TM"],
    [0x0040,0xA123,"PersonName","PN"],
    [0x0040,0xA124,"UID","UI"],
    [0x0040,0xA125,"ReportStatusIDTrial","CS"],
    [0x0040,0xA130,"TemporalRangeType","CS"],
    [0x0040,0xA132,"ReferencedSamplePositions","UL"],
    [0x0040,0xA136,"ReferencedFrameNumbers","US"],
    [0x0040,0xA138,"ReferencedTimeOffsets","DS"],
    [0x0040,0xA13A,"ReferencedDateTime","DT"],
    [0x0040,0xA160,"TextValue","UT"],
    [0x0040,0xA167,"ObservationCategoryCodeSequenceTrial","SQ"],
    [0x0040,0xA168,"ConceptCodeSequence","SQ"],
    [0x0040,0xA16A,"BibliographicCitationTrial","ST"],
    [0x0040,0xA170,"PurposeOfReferenceCodeSequence","SQ"],
    [0x0040,0xA171,"ObservationUIDTrial","UI"],
    [0x0040,0xA172,"ReferencedObservationUIDTrial","UI"],
    [0x0040,0xA173,"ReferencedObservationClassTrial","CS"],
    [0x0040,0xA174,"ReferencedObjectObservationClassTrial","CS"],
    [0x0040,0xA180,"AnnotationGroupNumber","US"],
    [0x0040,0xA192,"ObservationDateTrial","DA"],
    [0x0040,0xA193,"ObservationTimeTrial","TM"],
    [0x0040,0xA194,"MeasurementAutomationTrial","CS"],
    [0x0040,0xA195,"ModifierCodeSequence","SQ"],
    [0x0040,0xA224,"IdentificationDescriptionTrial","ST"],
    [0x0040,0xA290,"CoordinatesSetGeometricTypeTrial","CS"],
    [0x0040,0xA296,"AlgorithmCodeSequenceTrial","SQ"],
    [0x0040,0xA297,"AlgorithmDescriptionTrial","ST"],
    [0x0040,0xA29A,"PixelCoordinatesSetTrial","SL"],
    [0x0040,0xA300,"MeasuredValueSequence","SQ"],
    [0x0040,0xA301,"NumericValueQualifierCodeSequence","SQ"],
    [0x0040,0xA307,"CurrentObserverTrial","PN"],
    [0x0040,0xA30A,"NumericValue","DS"],
    [0x0040,0xA313,"ReferencedAccessionSequenceTrial","SQ"],
    [0x0040,0xA33A,"ReportStatusCommentTrial","ST"],
    [0x0040,0xA340,"ProcedureContextSequenceTrial","SQ"],
    [0x0040,0xA352,"VerbalSourceTrial","PN"],
    [0x0040,0xA353,"AddressTrial","ST"],
    [0x0040,0xA354,"TelephoneNumberTrial","LO"],
    [0x0040,0xA358,"VerbalSourceIdentifierCodeSequenceTrial","SQ"],
    [0x0040,0xA360,"PredecessorDocumentsSequence","SQ"],
    [0x0040,0xA370,"ReferencedRequestSequence","SQ"],
    [0x0040,0xA372,"PerformedProcedureCodeSequence","SQ"],
    [0x0040,0xA375,"CurrentRequestedProcedureEvidenceSequence","SQ"],
    [0x0040,0xA380,"ReportDetailSequenceTrial","SQ"],
    [0x0040,0xA385,"PertinentOtherEvidenceSequence","SQ"],
    [0x0040,0xA390,"HL7StructuredDocumentReferenceSequence","SQ"],
    [0x0040,0xA402,"ObservationSubjectUIDTrial","UI"],
    [0x0040,0xA403,"ObservationSubjectClassTrial","CS"],
    [0x0040,0xA404,"ObservationSubjectTypeCodeSequenceTrial","SQ"],
    [0x0040,0xA491,"CompletionFlag","CS"],
    [0x0040,0xA492,"CompletionFlagDescription","LO"],
    [0x0040,0xA493,"VerificationFlag","CS"],
    [0x0040,0xA494,"ArchiveRequested","CS"],
    [0x0040,0xA496,"PreliminaryFlag","CS"],
    [0x0040,0xA504,"ContentTemplateSequence","SQ"],
    [0x0040,0xA525,"IdenticalDocumentsSequence","SQ"],
    [0x0040,0xA600,"ObservationSubjectContextFlagTrial","CS"],
    [0x0040,0xA601,"ObserverContextFlagTrial","CS"],
    [0x0040,0xA603,"ProcedureContextFlagTrial","CS"],
    [0x0040,0xA730,"ContentSequence","SQ"],
    [0x0040,0xA731,"RelationshipSequenceTrial","SQ"],
    [0x0040,0xA732,"RelationshipTypeCodeSequenceTrial","SQ"],
    [0x0040,0xA744,"LanguageCodeSequenceTrial","SQ"],
    [0x0040,0xA992,"UniformResourceLocatorTrial","ST"],
    [0x0040,0xB020,"WaveformAnnotationSequence","SQ"],
    [0x0040,0xDB00,"TemplateIdentifier","CS"],
    [0x0040,0xDB06,"TemplateVersion","DT"],
    [0x0040,0xDB07,"TemplateLocalVersion","DT"],
    [0x0040,0xDB0B,"TemplateExtensionFlag","CS"],
    [0x0040,0xDB0C,"TemplateExtensionOrganizationUID","UI"],
    [0x0040,0xDB0D,"TemplateExtensionCreatorUID","UI"],
    [0x0040,0xDB73,"ReferencedContentItemIdentifier","UL"],
    [0x0040,0xE001,"HL7InstanceIdentifier","ST"],
    [0x0040,0xE004,"HL7DocumentEffectiveTime","DT"],
    [0x0040,0xE006,"HL7DocumentTypeCodeSequence","SQ"],
    [0x0040,0xE008,"DocumentClassCodeSequence","SQ"],
    [0x0040,0xE010,"RetrieveURI","UT"],
    [0x0040,0xE011,"RetrieveLocationUID","UI"],
    [0x0040,0xE020,"TypeOfInstances","CS"],
    [0x0040,0xE021,"DICOMRetrievalSequence","SQ"],
    [0x0040,0xE022,"DICOMMediaRetrievalSequence","SQ"],
    [0x0040,0xE023,"WADORetrievalSequence","SQ"],
    [0x0040,0xE024,"XDSRetrievalSequence","SQ"],
    [0x0040,0xE030,"RepositoryUniqueID","UI"],
    [0x0040,0xE031,"HomeCommunityID","UI"],
    [0x0042,0x0010,"DocumentTitle","ST"],
    [0x0042,0x0011,"EncapsulatedDocument","OB"],
    [0x0042,0x0012,"MIMETypeOfEncapsulatedDocument","LO"],
    [0x0042,0x0013,"SourceInstanceSequence","SQ"],
    [0x0042,0x0014,"ListOfMIMETypes","LO"],
    [0x0044,0x0001,"ProductPackageIdentifier","ST"],
    [0x0044,0x0002,"SubstanceAdministrationApproval","CS"],
    [0x0044,0x0003,"ApprovalStatusFurtherDescription","LT"],
    [0x0044,0x0004,"ApprovalStatusDateTime","DT"],
    [0x0044,0x0007,"ProductTypeCodeSequence","SQ"],
    [0x0044,0x0008,"ProductName","LO"],
    [0x0044,0x0009,"ProductDescription","LT"],
    [0x0044,0x000A,"ProductLotIdentifier","LO"],
    [0x0044,0x000B,"ProductExpirationDateTime","DT"],
    [0x0044,0x0010,"SubstanceAdministrationDateTime","DT"],
    [0x0044,0x0011,"SubstanceAdministrationNotes","LO"],
    [0x0044,0x0012,"SubstanceAdministrationDeviceID","LO"],
    [0x0044,0x0013,"ProductParameterSequence","SQ"],
    [0x0044,0x0019,"SubstanceAdministrationParameterSequence","SQ"],
    [0x0046,0x0012,"LensDescription","LO"],
    [0x0046,0x0014,"RightLensSequence","SQ"],
    [0x0046,0x0015,"LeftLensSequence","SQ"],
    [0x0046,0x0016,"UnspecifiedLateralityLensSequence","SQ"],
    [0x0046,0x0018,"CylinderSequence","SQ"],
    [0x0046,0x0028,"PrismSequence","SQ"],
    [0x0046,0x0030,"HorizontalPrismPower","FD"],
    [0x0046,0x0032,"HorizontalPrismBase","CS"],
    [0x0046,0x0034,"VerticalPrismPower","FD"],
    [0x0046,0x0036,"VerticalPrismBase","CS"],
    [0x0046,0x0038,"LensSegmentType","CS"],
    [0x0046,0x0040,"OpticalTransmittance","FD"],
    [0x0046,0x0042,"ChannelWidth","FD"],
    [0x0046,0x0044,"PupilSize","FD"],
    [0x0046,0x0046,"CornealSize","FD"],
    [0x0046,0x0050,"AutorefractionRightEyeSequence","SQ"],
    [0x0046,0x0052,"AutorefractionLeftEyeSequence","SQ"],
    [0x0046,0x0060,"DistancePupillaryDistance","FD"],
    [0x0046,0x0062,"NearPupillaryDistance","FD"],
    [0x0046,0x0063,"IntermediatePupillaryDistance","FD"],
    [0x0046,0x0064,"OtherPupillaryDistance","FD"],
    [0x0046,0x0070,"KeratometryRightEyeSequence","SQ"],
    [0x0046,0x0071,"KeratometryLeftEyeSequence","SQ"],
    [0x0046,0x0074,"SteepKeratometricAxisSequence","SQ"],
    [0x0046,0x0075,"RadiusOfCurvature","FD"],
    [0x0046,0x0076,"KeratometricPower","FD"],
    [0x0046,0x0077,"KeratometricAxis","FD"],
    [0x0046,0x0080,"FlatKeratometricAxisSequence","SQ"],
    [0x0046,0x0092,"BackgroundColor","CS"],
    [0x0046,0x0094,"Optotype","CS"],
    [0x0046,0x0095,"OptotypePresentation","CS"],
    [0x0046,0x0097,"SubjectiveRefractionRightEyeSequence","SQ"],
    [0x0046,0x0098,"SubjectiveRefractionLeftEyeSequence","SQ"],
    [0x0046,0x0100,"AddNearSequence","SQ"],
    [0x0046,0x0101,"AddIntermediateSequence","SQ"],
    [0x0046,0x0102,"AddOtherSequence","SQ"],
    [0x0046,0x0104,"AddPower","FD"],
    [0x0046,0x0106,"ViewingDistance","FD"],
    [0x0046,0x0121,"VisualAcuityTypeCodeSequence","SQ"],
    [0x0046,0x0122,"VisualAcuityRightEyeSequence","SQ"],
    [0x0046,0x0123,"VisualAcuityLeftEyeSequence","SQ"],
    [0x0046,0x0124,"VisualAcuityBothEyesOpenSequence","SQ"],
    [0x0046,0x0125,"ViewingDistanceType","CS"],
    [0x0046,0x0135,"VisualAcuityModifiers","SS"],
    [0x0046,0x0137,"DecimalVisualAcuity","FD"],
    [0x0046,0x0139,"OptotypeDetailedDefinition","LO"],
    [0x0046,0x0145,"ReferencedRefractiveMeasurementsSequence","SQ"],
    [0x0046,0x0146,"SpherePower","FD"],
    [0x0046,0x0147,"CylinderPower","FD"],
    [0x0048,0x0001,"ImagedVolumeWidth","FL"],
    [0x0048,0x0002,"ImagedVolumeHeight","FL"],
    [0x0048,0x0003,"ImagedVolumeDepth","FL"],
    [0x0048,0x0006,"TotalPixelMatrixColumns","UL"],
    [0x0048,0x0007,"TotalPixelMatrixRows","UL"],
    [0x0048,0x0008,"TotalPixelMatrixOriginSequence","SQ"],
    [0x0048,0x0010,"SpecimenLabelInImage","CS"],
    [0x0048,0x0011,"FocusMethod","CS"],
    [0x0048,0x0012,"ExtendedDepthOfField","CS"],
    [0x0048,0x0013,"NumberOfFocalPlanes","US"],
    [0x0048,0x0014,"DistanceBetweenFocalPlanes","FL"],
    [0x0048,0x0015,"RecommendedAbsentPixelCIELabValue","US"],
    [0x0048,0x0100,"IlluminatorTypeCodeSequence","SQ"],
    [0x0048,0x0102,"ImageOrientationSlide","DS"],
    [0x0048,0x0105,"OpticalPathSequence","SQ"],
    [0x0048,0x0106,"OpticalPathIdentifier","SH"],
    [0x0048,0x0107,"OpticalPathDescription","ST"],
    [0x0048,0x0108,"IlluminationColorCodeSequence","SQ"],
    [0x0048,0x0110,"SpecimenReferenceSequence","SQ"],
    [0x0048,0x0111,"CondenserLensPower","DS"],
    [0x0048,0x0112,"ObjectiveLensPower","DS"],
    [0x0048,0x0113,"ObjectiveLensNumericalAperture","DS"],
    [0x0048,0x0120,"PaletteColorLookupTableSequence","SQ"],
    [0x0048,0x0200,"ReferencedImageNavigationSequence","SQ"],
    [0x0048,0x0201,"TopLeftHandCornerOfLocalizerArea","US"],
    [0x0048,0x0202,"BottomRightHandCornerOfLocalizerArea","US"],
    [0x0048,0x0207,"OpticalPathIdentificationSequence","SQ"],
    [0x0048,0x021A,"PlanePositionSlideSequence","SQ"],
    [0x0048,0x021E,"RowPositionInTotalImagePixelMatrix","SL"],
    [0x0048,0x021F,"ColumnPositionInTotalImagePixelMatrix","SL"],
    [0x0048,0x0301,"PixelOriginInterpretation","CS"],
    [0x0050,0x0004,"CalibrationImage","CS"],
    [0x0050,0x0010,"DeviceSequence","SQ"],
    [0x0050,0x0012,"ContainerComponentTypeCodeSequence","SQ"],
    [0x0050,0x0013,"ContainerComponentThickness","FD"],
    [0x0050,0x0014,"DeviceLength","DS"],
    [0x0050,0x0015,"ContainerComponentWidth","FD"],
    [0x0050,0x0016,"DeviceDiameter","DS"],
    [0x0050,0x0017,"DeviceDiameterUnits","CS"],
    [0x0050,0x0018,"DeviceVolume","DS"],
    [0x0050,0x0019,"InterMarkerDistance","DS"],
    [0x0050,0x001A,"ContainerComponentMaterial","CS"],
    [0x0050,0x001B,"ContainerComponentID","LO"],
    [0x0050,0x001C,"ContainerComponentLength","FD"],
    [0x0050,0x001D,"ContainerComponentDiameter","FD"],
    [0x0050,0x001E,"ContainerComponentDescription","LO"],
    [0x0050,0x0020,"DeviceDescription","LO"],
    [0x0052,0x0001,"ContrastBolusIngredientPercentByVolume","FL"],
    [0x0052,0x0002,"OCTFocalDistance","FD"],
    [0x0052,0x0003,"BeamSpotSize","FD"],
    [0x0052,0x0004,"EffectiveRefractiveIndex","FD"],
    [0x0052,0x0006,"OCTAcquisitionDomain","CS"],
    [0x0052,0x0007,"OCTOpticalCenterWavelength","FD"],
    [0x0052,0x0008,"AxialResolution","FD"],
    [0x0052,0x0009,"RangingDepth","FD"],
    [0x0052,0x0011,"ALineRate","FD"],
    [0x0052,0x0012,"ALinesPerFrame","US"],
    [0x0052,0x0013,"CatheterRotationalRate","FD"],
    [0x0052,0x0014,"ALinePixelSpacing","FD"],
    [0x0052,0x0016,"ModeOfPercutaneousAccessSequence","SQ"],
    [0x0052,0x0025,"IntravascularOCTFrameTypeSequence","SQ"],
    [0x0052,0x0026,"OCTZOffsetApplied","CS"],
    [0x0052,0x0027,"IntravascularFrameContentSequence","SQ"],
    [0x0052,0x0028,"IntravascularLongitudinalDistance","FD"],
    [0x0052,0x0029,"IntravascularOCTFrameContentSequence","SQ"],
    [0x0052,0x0030,"OCTZOffsetCorrection","SS"],
    [0x0052,0x0031,"CatheterDirectionOfRotation","CS"],
    [0x0052,0x0033,"SeamLineLocation","FD"],
    [0x0052,0x0034,"FirstALineLocation","FD"],
    [0x0052,0x0036,"SeamLineIndex","US"],
    [0x0052,0x0038,"NumberOfPaddedAlines","US"],
    [0x0052,0x0039,"InterpolationType","CS"],
    [0x0052,0x003A,"RefractiveIndexApplied","CS"],
    [0x0054,0x0010,"EnergyWindowVector","US"],
    [0x0054,0x0011,"NumberOfEnergyWindows","US"],
    [0x0054,0x0012,"EnergyWindowInformationSequence","SQ"],
    [0x0054,0x0013,"EnergyWindowRangeSequence","SQ"],
    [0x0054,0x0014,"EnergyWindowLowerLimit","DS"],
    [0x0054,0x0015,"EnergyWindowUpperLimit","DS"],
    [0x0054,0x0016,"RadiopharmaceuticalInformationSequence","SQ"],
    [0x0054,0x0017,"ResidualSyringeCounts","IS"],
    [0x0054,0x0018,"EnergyWindowName","SH"],
    [0x0054,0x0020,"DetectorVector","US"],
    [0x0054,0x0021,"NumberOfDetectors","US"],
    [0x0054,0x0022,"DetectorInformationSequence","SQ"],
    [0x0054,0x0030,"PhaseVector","US"],
    [0x0054,0x0031,"NumberOfPhases","US"],
    [0x0054,0x0032,"PhaseInformationSequence","SQ"],
    [0x0054,0x0033,"NumberOfFramesInPhase","US"],
    [0x0054,0x0036,"PhaseDelay","IS"],
    [0x0054,0x0038,"PauseBetweenFrames","IS"],
    [0x0054,0x0039,"PhaseDescription","CS"],
    [0x0054,0x0050,"RotationVector","US"],
    [0x0054,0x0051,"NumberOfRotations","US"],
    [0x0054,0x0052,"RotationInformationSequence","SQ"],
    [0x0054,0x0053,"NumberOfFramesInRotation","US"],
    [0x0054,0x0060,"RRIntervalVector","US"],
    [0x0054,0x0061,"NumberOfRRIntervals","US"],
    [0x0054,0x0062,"GatedInformationSequence","SQ"],
    [0x0054,0x0063,"DataInformationSequence","SQ"],
    [0x0054,0x0070,"TimeSlotVector","US"],
    [0x0054,0x0071,"NumberOfTimeSlots","US"],
    [0x0054,0x0072,"TimeSlotInformationSequence","SQ"],
    [0x0054,0x0073,"TimeSlotTime","DS"],
    [0x0054,0x0080,"SliceVector","US"],
    [0x0054,0x0081,"NumberOfSlices","US"],
    [0x0054,0x0090,"AngularViewVector","US"],
    [0x0054,0x0100,"TimeSliceVector","US"],
    [0x0054,0x0101,"NumberOfTimeSlices","US"],
    [0x0054,0x0200,"StartAngle","DS"],
    [0x0054,0x0202,"TypeOfDetectorMotion","CS"],
    [0x0054,0x0210,"TriggerVector","IS"],
    [0x0054,0x0211,"NumberOfTriggersInPhase","US"],
    [0x0054,0x0220,"ViewCodeSequence","SQ"],
    [0x0054,0x0222,"ViewModifierCodeSequence","SQ"],
    [0x0054,0x0300,"RadionuclideCodeSequence","SQ"],
    [0x0054,0x0302,"AdministrationRouteCodeSequence","SQ"],
    [0x0054,0x0304,"RadiopharmaceuticalCodeSequence","SQ"],
    [0x0054,0x0306,"CalibrationDataSequence","SQ"],
    [0x0054,0x0308,"EnergyWindowNumber","US"],
    [0x0054,0x0400,"ImageID","SH"],
    [0x0054,0x0410,"PatientOrientationCodeSequence","SQ"],
    [0x0054,0x0412,"PatientOrientationModifierCodeSequence","SQ"],
    [0x0054,0x0414,"PatientGantryRelationshipCodeSequence","SQ"],
    [0x0054,0x0500,"SliceProgressionDirection","CS"],
    [0x0054,0x1000,"SeriesType","CS"],
    [0x0054,0x1001,"Units","CS"],
    [0x0054,0x1002,"CountsSource","CS"],
    [0x0054,0x1004,"ReprojectionMethod","CS"],
    [0x0054,0x1006,"SUVType","CS"],
    [0x0054,0x1100,"RandomsCorrectionMethod","CS"],
    [0x0054,0x1101,"AttenuationCorrectionMethod","LO"],
    [0x0054,0x1102,"DecayCorrection","CS"],
    [0x0054,0x1103,"ReconstructionMethod","LO"],
    [0x0054,0x1104,"DetectorLinesOfResponseUsed","LO"],
    [0x0054,0x1105,"ScatterCorrectionMethod","LO"],
    [0x0054,0x1200,"AxialAcceptance","DS"],
    [0x0054,0x1201,"AxialMash","IS"],
    [0x0054,0x1202,"TransverseMash","IS"],
    [0x0054,0x1203,"DetectorElementSize","DS"],
    [0x0054,0x1210,"CoincidenceWindowWidth","DS"],
    [0x0054,0x1220,"SecondaryCountsType","CS"],
    [0x0054,0x1300,"FrameReferenceTime","DS"],
    [0x0054,0x1310,"PrimaryPromptsCountsAccumulated","IS"],
    [0x0054,0x1311,"SecondaryCountsAccumulated","IS"],
    [0x0054,0x1320,"SliceSensitivityFactor","DS"],
    [0x0054,0x1321,"DecayFactor","DS"],
    [0x0054,0x1322,"DoseCalibrationFactor","DS"],
    [0x0054,0x1323,"ScatterFractionFactor","DS"],
    [0x0054,0x1324,"DeadTimeFactor","DS"],
    [0x0054,0x1330,"ImageIndex","US"],
    [0x0054,0x1400,"CountsIncluded","CS"],
    [0x0054,0x1401,"DeadTimeCorrectionFlag","CS"],
    [0x0060,0x3000,"HistogramSequence","SQ"],
    [0x0060,0x3002,"HistogramNumberOfBins","US"],
    [0x0060,0x3004,"HistogramFirstBinValue","SS"],
    [0x0060,0x3006,"HistogramLastBinValue","SS"],
    [0x0060,0x3008,"HistogramBinWidth","US"],
    [0x0060,0x3010,"HistogramExplanation","LO"],
    [0x0060,0x3020,"HistogramData","UL"],
    [0x0062,0x0001,"SegmentationType","CS"],
    [0x0062,0x0002,"SegmentSequence","SQ"],
    [0x0062,0x0003,"SegmentedPropertyCategoryCodeSequence","SQ"],
    [0x0062,0x0004,"SegmentNumber","US"],
    [0x0062,0x0005,"SegmentLabel","LO"],
    [0x0062,0x0006,"SegmentDescription","ST"],
    [0x0062,0x0008,"SegmentAlgorithmType","CS"],
    [0x0062,0x0009,"SegmentAlgorithmName","LO"],
    [0x0062,0x000A,"SegmentIdentificationSequence","SQ"],
    [0x0062,0x000B,"ReferencedSegmentNumber","US"],
    [0x0062,0x000C,"RecommendedDisplayGrayscaleValue","US"],
    [0x0062,0x000D,"RecommendedDisplayCIELabValue","US"],
    [0x0062,0x000E,"MaximumFractionalValue","US"],
    [0x0062,0x000F,"SegmentedPropertyTypeCodeSequence","SQ"],
    [0x0062,0x0010,"SegmentationFractionalType","CS"],
    [0x0064,0x0002,"DeformableRegistrationSequence","SQ"],
    [0x0064,0x0003,"SourceFrameOfReferenceUID","UI"],
    [0x0064,0x0005,"DeformableRegistrationGridSequence","SQ"],
    [0x0064,0x0007,"GridDimensions","UL"],
    [0x0064,0x0008,"GridResolution","FD"],
    [0x0064,0x0009,"VectorGridData","OF"],
    [0x0064,0x000F,"PreDeformationMatrixRegistrationSequence","SQ"],
    [0x0064,0x0010,"PostDeformationMatrixRegistrationSequence","SQ"],
    [0x0066,0x0001,"NumberOfSurfaces","UL"],
    [0x0066,0x0002,"SurfaceSequence","SQ"],
    [0x0066,0x0003,"SurfaceNumber","UL"],
    [0x0066,0x0004,"SurfaceComments","LT"],
    [0x0066,0x0009,"SurfaceProcessing","CS"],
    [0x0066,0x000A,"SurfaceProcessingRatio","FL"],
    [0x0066,0x000B,"SurfaceProcessingDescription","LO"],
    [0x0066,0x000C,"RecommendedPresentationOpacity","FL"],
    [0x0066,0x000D,"RecommendedPresentationType","CS"],
    [0x0066,0x000E,"FiniteVolume","CS"],
    [0x0066,0x0010,"Manifold","CS"],
    [0x0066,0x0011,"SurfacePointsSequence","SQ"],
    [0x0066,0x0012,"SurfacePointsNormalsSequence","SQ"],
    [0x0066,0x0013,"SurfaceMeshPrimitivesSequence","SQ"],
    [0x0066,0x0015,"NumberOfSurfacePoints","UL"],
    [0x0066,0x0016,"PointCoordinatesData","OF"],
    [0x0066,0x0017,"PointPositionAccuracy","FL"],
    [0x0066,0x0018,"MeanPointDistance","FL"],
    [0x0066,0x0019,"MaximumPointDistance","FL"],
    [0x0066,0x001A,"PointsBoundingBoxCoordinates","FL"],
    [0x0066,0x001B,"AxisOfRotation","FL"],
    [0x0066,0x001C,"CenterOfRotation","FL"],
    [0x0066,0x001E,"NumberOfVectors","UL"],
    [0x0066,0x001F,"VectorDimensionality","US"],
    [0x0066,0x0020,"VectorAccuracy","FL"],
    [0x0066,0x0021,"VectorCoordinateData","OF"],
    [0x0066,0x0023,"TrianglePointIndexList","OW"],
    [0x0066,0x0024,"EdgePointIndexList","OW"],
    [0x0066,0x0025,"VertexPointIndexList","OW"],
    [0x0066,0x0026,"TriangleStripSequence","SQ"],
    [0x0066,0x0027,"TriangleFanSequence","SQ"],
    [0x0066,0x0028,"LineSequence","SQ"],
    [0x0066,0x0029,"PrimitivePointIndexList","OW"],
    [0x0066,0x002A,"SurfaceCount","UL"],
    [0x0066,0x002B,"ReferencedSurfaceSequence","SQ"],
    [0x0066,0x002C,"ReferencedSurfaceNumber","UL"],
    [0x0066,0x002D,"SegmentSurfaceGenerationAlgorithmIdentificationSequence","SQ"],
    [0x0066,0x002E,"SegmentSurfaceSourceInstanceSequence","SQ"],
    [0x0066,0x002F,"AlgorithmFamilyCodeSequence","SQ"],
    [0x0066,0x0030,"AlgorithmNameCodeSequence","SQ"],
    [0x0066,0x0031,"AlgorithmVersion","LO"],
    [0x0066,0x0032,"AlgorithmParameters","LT"],
    [0x0066,0x0034,"FacetSequence","SQ"],
    [0x0066,0x0035,"SurfaceProcessingAlgorithmIdentificationSequence","SQ"],
    [0x0066,0x0036,"AlgorithmName","LO"],
    [0x0068,0x6210,"ImplantSize","LO"],
    [0x0068,0x6221,"ImplantTemplateVersion","LO"],
    [0x0068,0x6222,"ReplacedImplantTemplateSequence","SQ"],
    [0x0068,0x6223,"ImplantType","CS"],
    [0x0068,0x6224,"DerivationImplantTemplateSequence","SQ"],
    [0x0068,0x6225,"OriginalImplantTemplateSequence","SQ"],
    [0x0068,0x6226,"EffectiveDateTime","DT"],
    [0x0068,0x6230,"ImplantTargetAnatomySequence","SQ"],
    [0x0068,0x6260,"InformationFromManufacturerSequence","SQ"],
    [0x0068,0x6265,"NotificationFromManufacturerSequence","SQ"],
    [0x0068,0x6270,"InformationIssueDateTime","DT"],
    [0x0068,0x6280,"InformationSummary","ST"],
    [0x0068,0x62A0,"ImplantRegulatoryDisapprovalCodeSequence","SQ"],
    [0x0068,0x62A5,"OverallTemplateSpatialTolerance","FD"],
    [0x0068,0x62C0,"HPGLDocumentSequence","SQ"],
    [0x0068,0x62D0,"HPGLDocumentID","US"],
    [0x0068,0x62D5,"HPGLDocumentLabel","LO"],
    [0x0068,0x62E0,"ViewOrientationCodeSequence","SQ"],
    [0x0068,0x62F0,"ViewOrientationModifier","FD"],
    [0x0068,0x62F2,"HPGLDocumentScaling","FD"],
    [0x0068,0x6300,"HPGLDocument","OB"],
    [0x0068,0x6310,"HPGLContourPenNumber","US"],
    [0x0068,0x6320,"HPGLPenSequence","SQ"],
    [0x0068,0x6330,"HPGLPenNumber","US"],
    [0x0068,0x6340,"HPGLPenLabel","LO"],
    [0x0068,0x6345,"HPGLPenDescription","ST"],
    [0x0068,0x6346,"RecommendedRotationPoint","FD"],
    [0x0068,0x6347,"BoundingRectangle","FD"],
    [0x0068,0x6350,"ImplantTemplate3DModelSurfaceNumber","US"],
    [0x0068,0x6360,"SurfaceModelDescriptionSequence","SQ"],
    [0x0068,0x6380,"SurfaceModelLabel","LO"],
    [0x0068,0x6390,"SurfaceModelScalingFactor","FD"],
    [0x0068,0x63A0,"MaterialsCodeSequence","SQ"],
    [0x0068,0x63A4,"CoatingMaterialsCodeSequence","SQ"],
    [0x0068,0x63A8,"ImplantTypeCodeSequence","SQ"],
    [0x0068,0x63AC,"FixationMethodCodeSequence","SQ"],
    [0x0068,0x63B0,"MatingFeatureSetsSequence","SQ"],
    [0x0068,0x63C0,"MatingFeatureSetID","US"],
    [0x0068,0x63D0,"MatingFeatureSetLabel","LO"],
    [0x0068,0x63E0,"MatingFeatureSequence","SQ"],
    [0x0068,0x63F0,"MatingFeatureID","US"],
    [0x0068,0x6400,"MatingFeatureDegreeOfFreedomSequence","SQ"],
    [0x0068,0x6410,"DegreeOfFreedomID","US"],
    [0x0068,0x6420,"DegreeOfFreedomType","CS"],
    [0x0068,0x6430,"TwoDMatingFeatureCoordinatesSequence","SQ"],
    [0x0068,0x6440,"ReferencedHPGLDocumentID","US"],
    [0x0068,0x6450,"TwoDMatingPoint","FD"],
    [0x0068,0x6460,"TwoDMatingAxes","FD"],
    [0x0068,0x6470,"TwoDDegreeOfFreedomSequence","SQ"],
    [0x0068,0x6490,"ThreeDDegreeOfFreedomAxis","FD"],
    [0x0068,0x64A0,"RangeOfFreedom","FD"],
    [0x0068,0x64C0,"ThreeDMatingPoint","FD"],
    [0x0068,0x64D0,"ThreeDMatingAxes","FD"],
    [0x0068,0x64F0,"TwoDDegreeOfFreedomAxis","FD"],
    [0x0068,0x6500,"PlanningLandmarkPointSequence","SQ"],
    [0x0068,0x6510,"PlanningLandmarkLineSequence","SQ"],
    [0x0068,0x6520,"PlanningLandmarkPlaneSequence","SQ"],
    [0x0068,0x6530,"PlanningLandmarkID","US"],
    [0x0068,0x6540,"PlanningLandmarkDescription","LO"],
    [0x0068,0x6545,"PlanningLandmarkIdentificationCodeSequence","SQ"],
    [0x0068,0x6550,"TwoDPointCoordinatesSequence","SQ"],
    [0x0068,0x6560,"TwoDPointCoordinates","FD"],
    [0x0068,0x6590,"ThreeDPointCoordinates","FD"],
    [0x0068,0x65A0,"TwoDLineCoordinatesSequence","SQ"],
    [0x0068,0x65B0,"TwoDLineCoordinates","FD"],
    [0x0068,0x65D0,"ThreeDLineCoordinates","FD"],
    [0x0068,0x65E0,"TwoDPlaneCoordinatesSequence","SQ"],
    [0x0068,0x65F0,"TwoDPlaneIntersection","FD"],
    [0x0068,0x6610,"ThreeDPlaneOrigin","FD"],
    [0x0068,0x6620,"ThreeDPlaneNormal","FD"],
    [0x0070,0x0001,"GraphicAnnotationSequence","SQ"],
    [0x0070,0x0002,"GraphicLayer","CS"],
    [0x0070,0x0003,"BoundingBoxAnnotationUnits","CS"],
    [0x0070,0x0004,"AnchorPointAnnotationUnits","CS"],
    [0x0070,0x0005,"GraphicAnnotationUnits","CS"],
    [0x0070,0x0006,"UnformattedTextValue","ST"],
    [0x0070,0x0008,"TextObjectSequence","SQ"],
    [0x0070,0x0009,"GraphicObjectSequence","SQ"],
    [0x0070,0x0010,"BoundingBoxTopLeftHandCorner","FL"],
    [0x0070,0x0011,"BoundingBoxBottomRightHandCorner","FL"],
    [0x0070,0x0012,"BoundingBoxTextHorizontalJustification","CS"],
    [0x0070,0x0014,"AnchorPoint","FL"],
    [0x0070,0x0015,"AnchorPointVisibility","CS"],
    [0x0070,0x0020,"GraphicDimensions","US"],
    [0x0070,0x0021,"NumberOfGraphicPoints","US"],
    [0x0070,0x0022,"GraphicData","FL"],
    [0x0070,0x0023,"GraphicType","CS"],
    [0x0070,0x0024,"GraphicFilled","CS"],
    [0x0070,0x0040,"ImageRotationRetired","IS"],
    [0x0070,0x0041,"ImageHorizontalFlip","CS"],
    [0x0070,0x0042,"ImageRotation","US"],
    [0x0070,0x0050,"DisplayedAreaTopLeftHandCornerTrial","US"],
    [0x0070,0x0051,"DisplayedAreaBottomRightHandCornerTrial","US"],
    [0x0070,0x0052,"DisplayedAreaTopLeftHandCorner","SL"],
    [0x0070,0x0053,"DisplayedAreaBottomRightHandCorner","SL"],
    [0x0070,0x005A,"DisplayedAreaSelectionSequence","SQ"],
    [0x0070,0x0060,"GraphicLayerSequence","SQ"],
    [0x0070,0x0062,"GraphicLayerOrder","IS"],
    [0x0070,0x0066,"GraphicLayerRecommendedDisplayGrayscaleValue","US"],
    [0x0070,0x0067,"GraphicLayerRecommendedDisplayRGBValue","US"],
    [0x0070,0x0068,"GraphicLayerDescription","LO"],
    [0x0070,0x0080,"ContentLabel","CS"],
    [0x0070,0x0081,"ContentDescription","LO"],
    [0x0070,0x0082,"PresentationCreationDate","DA"],
    [0x0070,0x0083,"PresentationCreationTime","TM"],
    [0x0070,0x0084,"ContentCreatorName","PN"],
    [0x0070,0x0086,"ContentCreatorIdentificationCodeSequence","SQ"],
    [0x0070,0x0087,"AlternateContentDescriptionSequence","SQ"],
    [0x0070,0x0100,"PresentationSizeMode","CS"],
    [0x0070,0x0101,"PresentationPixelSpacing","DS"],
    [0x0070,0x0102,"PresentationPixelAspectRatio","IS"],
    [0x0070,0x0103,"PresentationPixelMagnificationRatio","FL"],
    [0x0070,0x0207,"GraphicGroupLabel","LO"],
    [0x0070,0x0208,"GraphicGroupDescription","ST"],
    [0x0070,0x0209,"CompoundGraphicSequence","SQ"],
    [0x0070,0x0226,"CompoundGraphicInstanceID","UL"],
    [0x0070,0x0227,"FontName","LO"],
    [0x0070,0x0228,"FontNameType","CS"],
    [0x0070,0x0229,"CSSFontName","LO"],
    [0x0070,0x0230,"RotationAngle","FD"],
    [0x0070,0x0231,"TextStyleSequence","SQ"],
    [0x0070,0x0232,"LineStyleSequence","SQ"],
    [0x0070,0x0233,"FillStyleSequence","SQ"],
    [0x0070,0x0234,"GraphicGroupSequence","SQ"],
    [0x0070,0x0241,"TextColorCIELabValue","US"],
    [0x0070,0x0242,"HorizontalAlignment","CS"],
    [0x0070,0x0243,"VerticalAlignment","CS"],
    [0x0070,0x0244,"ShadowStyle","CS"],
    [0x0070,0x0245,"ShadowOffsetX","FL"],
    [0x0070,0x0246,"ShadowOffsetY","FL"],
    [0x0070,0x0247,"ShadowColorCIELabValue","US"],
    [0x0070,0x0248,"Underlined","CS"],
    [0x0070,0x0249,"Bold","CS"],
    [0x0070,0x0250,"Italic","CS"],
    [0x0070,0x0251,"PatternOnColorCIELabValue","US"],
    [0x0070,0x0252,"PatternOffColorCIELabValue","US"],
    [0x0070,0x0253,"LineThickness","FL"],
    [0x0070,0x0254,"LineDashingStyle","CS"],
    [0x0070,0x0255,"LinePattern","UL"],
    [0x0070,0x0256,"FillPattern","OB"],
    [0x0070,0x0257,"FillMode","CS"],
    [0x0070,0x0258,"ShadowOpacity","FL"],
    [0x0070,0x0261,"GapLength","FL"],
    [0x0070,0x0262,"DiameterOfVisibility","FL"],
    [0x0070,0x0273,"RotationPoint","FL"],
    [0x0070,0x0274,"TickAlignment","CS"],
    [0x0070,0x0278,"ShowTickLabel","CS"],
    [0x0070,0x0279,"TickLabelAlignment","CS"],
    [0x0070,0x0282,"CompoundGraphicUnits","CS"],
    [0x0070,0x0284,"PatternOnOpacity","FL"],
    [0x0070,0x0285,"PatternOffOpacity","FL"],
    [0x0070,0x0287,"MajorTicksSequence","SQ"],
    [0x0070,0x0288,"TickPosition","FL"],
    [0x0070,0x0289,"TickLabel","SH"],
    [0x0070,0x0294,"CompoundGraphicType","CS"],
    [0x0070,0x0295,"GraphicGroupID","UL"],
    [0x0070,0x0306,"ShapeType","CS"],
    [0x0070,0x0308,"RegistrationSequence","SQ"],
    [0x0070,0x0309,"MatrixRegistrationSequence","SQ"],
    [0x0070,0x030A,"MatrixSequence","SQ"],
    [0x0070,0x030C,"FrameOfReferenceTransformationMatrixType","CS"],
    [0x0070,0x030D,"RegistrationTypeCodeSequence","SQ"],
    [0x0070,0x030F,"FiducialDescription","ST"],
    [0x0070,0x0310,"FiducialIdentifier","SH"],
    [0x0070,0x0311,"FiducialIdentifierCodeSequence","SQ"],
    [0x0070,0x0312,"ContourUncertaintyRadius","FD"],
    [0x0070,0x0314,"UsedFiducialsSequence","SQ"],
    [0x0070,0x0318,"GraphicCoordinatesDataSequence","SQ"],
    [0x0070,0x031A,"FiducialUID","UI"],
    [0x0070,0x031C,"FiducialSetSequence","SQ"],
    [0x0070,0x031E,"FiducialSequence","SQ"],
    [0x0070,0x0401,"GraphicLayerRecommendedDisplayCIELabValue","US"],
    [0x0070,0x0402,"BlendingSequence","SQ"],
    [0x0070,0x0403,"RelativeOpacity","FL"],
    [0x0070,0x0404,"ReferencedSpatialRegistrationSequence","SQ"],
    [0x0070,0x0405,"BlendingPosition","CS"],
    [0x0072,0x0002,"HangingProtocolName","SH"],
    [0x0072,0x0004,"HangingProtocolDescription","LO"],
    [0x0072,0x0006,"HangingProtocolLevel","CS"],
    [0x0072,0x0008,"HangingProtocolCreator","LO"],
    [0x0072,0x000A,"HangingProtocolCreationDateTime","DT"],
    [0x0072,0x000C,"HangingProtocolDefinitionSequence","SQ"],
    [0x0072,0x000E,"HangingProtocolUserIdentificationCodeSequence","SQ"],
    [0x0072,0x0010,"HangingProtocolUserGroupName","LO"],
    [0x0072,0x0012,"SourceHangingProtocolSequence","SQ"],
    [0x0072,0x0014,"NumberOfPriorsReferenced","US"],
    [0x0072,0x0020,"ImageSetsSequence","SQ"],
    [0x0072,0x0022,"ImageSetSelectorSequence","SQ"],
    [0x0072,0x0024,"ImageSetSelectorUsageFlag","CS"],
    [0x0072,0x0026,"SelectorAttribute","AT"],
    [0x0072,0x0028,"SelectorValueNumber","US"],
    [0x0072,0x0030,"TimeBasedImageSetsSequence","SQ"],
    [0x0072,0x0032,"ImageSetNumber","US"],
    [0x0072,0x0034,"ImageSetSelectorCategory","CS"],
    [0x0072,0x0038,"RelativeTime","US"],
    [0x0072,0x003A,"RelativeTimeUnits","CS"],
    [0x0072,0x003C,"AbstractPriorValue","SS"],
    [0x0072,0x003E,"AbstractPriorCodeSequence","SQ"],
    [0x0072,0x0040,"ImageSetLabel","LO"],
    [0x0072,0x0050,"SelectorAttributeVR","CS"],
    [0x0072,0x0052,"SelectorSequencePointer","AT"],
    [0x0072,0x0054,"SelectorSequencePointerPrivateCreator","LO"],
    [0x0072,0x0056,"SelectorAttributePrivateCreator","LO"],
    [0x0072,0x0060,"SelectorATValue","AT"],
    [0x0072,0x0062,"SelectorCSValue","CS"],
    [0x0072,0x0064,"SelectorISValue","IS"],
    [0x0072,0x0066,"SelectorLOValue","LO"],
    [0x0072,0x0068,"SelectorLTValue","LT"],
    [0x0072,0x006A,"SelectorPNValue","PN"],
    [0x0072,0x006C,"SelectorSHValue","SH"],
    [0x0072,0x006E,"SelectorSTValue","ST"],
    [0x0072,0x0070,"SelectorUTValue","UT"],
    [0x0072,0x0072,"SelectorDSValue","DS"],
    [0x0072,0x0074,"SelectorFDValue","FD"],
    [0x0072,0x0076,"SelectorFLValue","FL"],
    [0x0072,0x0078,"SelectorULValue","UL"],
    [0x0072,0x007A,"SelectorUSValue","US"],
    [0x0072,0x007C,"SelectorSLValue","SL"],
    [0x0072,0x007E,"SelectorSSValue","SS"],
    [0x0072,0x0080,"SelectorCodeSequenceValue","SQ"],
    [0x0072,0x0100,"NumberOfScreens","US"],
    [0x0072,0x0102,"NominalScreenDefinitionSequence","SQ"],
    [0x0072,0x0104,"NumberOfVerticalPixels","US"],
    [0x0072,0x0106,"NumberOfHorizontalPixels","US"],
    [0x0072,0x0108,"DisplayEnvironmentSpatialPosition","FD"],
    [0x0072,0x010A,"ScreenMinimumGrayscaleBitDepth","US"],
    [0x0072,0x010C,"ScreenMinimumColorBitDepth","US"],
    [0x0072,0x010E,"ApplicationMaximumRepaintTime","US"],
    [0x0072,0x0200,"DisplaySetsSequence","SQ"],
    [0x0072,0x0202,"DisplaySetNumber","US"],
    [0x0072,0x0203,"DisplaySetLabel","LO"],
    [0x0072,0x0204,"DisplaySetPresentationGroup","US"],
    [0x0072,0x0206,"DisplaySetPresentationGroupDescription","LO"],
    [0x0072,0x0208,"PartialDataDisplayHandling","CS"],
    [0x0072,0x0210,"SynchronizedScrollingSequence","SQ"],
    [0x0072,0x0212,"DisplaySetScrollingGroup","US"],
    [0x0072,0x0214,"NavigationIndicatorSequence","SQ"],
    [0x0072,0x0216,"NavigationDisplaySet","US"],
    [0x0072,0x0218,"ReferenceDisplaySets","US"],
    [0x0072,0x0300,"ImageBoxesSequence","SQ"],
    [0x0072,0x0302,"ImageBoxNumber","US"],
    [0x0072,0x0304,"ImageBoxLayoutType","CS"],
    [0x0072,0x0306,"ImageBoxTileHorizontalDimension","US"],
    [0x0072,0x0308,"ImageBoxTileVerticalDimension","US"],
    [0x0072,0x0310,"ImageBoxScrollDirection","CS"],
    [0x0072,0x0312,"ImageBoxSmallScrollType","CS"],
    [0x0072,0x0314,"ImageBoxSmallScrollAmount","US"],
    [0x0072,0x0316,"ImageBoxLargeScrollType","CS"],
    [0x0072,0x0318,"ImageBoxLargeScrollAmount","US"],
    [0x0072,0x0320,"ImageBoxOverlapPriority","US"],
    [0x0072,0x0330,"CineRelativeToRealTime","FD"],
    [0x0072,0x0400,"FilterOperationsSequence","SQ"],
    [0x0072,0x0402,"FilterByCategory","CS"],
    [0x0072,0x0404,"FilterByAttributePresence","CS"],
    [0x0072,0x0406,"FilterByOperator","CS"],
    [0x0072,0x0420,"StructuredDisplayBackgroundCIELabValue","US"],
    [0x0072,0x0421,"EmptyImageBoxCIELabValue","US"],
    [0x0072,0x0422,"StructuredDisplayImageBoxSequence","SQ"],
    [0x0072,0x0424,"StructuredDisplayTextBoxSequence","SQ"],
    [0x0072,0x0427,"ReferencedFirstFrameSequence","SQ"],
    [0x0072,0x0430,"ImageBoxSynchronizationSequence","SQ"],
    [0x0072,0x0432,"SynchronizedImageBoxList","US"],
    [0x0072,0x0434,"TypeOfSynchronization","CS"],
    [0x0072,0x0500,"BlendingOperationType","CS"],
    [0x0072,0x0510,"ReformattingOperationType","CS"],
    [0x0072,0x0512,"ReformattingThickness","FD"],
    [0x0072,0x0514,"ReformattingInterval","FD"],
    [0x0072,0x0516,"ReformattingOperationInitialViewDirection","CS"],
    [0x0072,0x0520,"ThreeDRenderingType","CS"],
    [0x0072,0x0600,"SortingOperationsSequence","SQ"],
    [0x0072,0x0602,"SortByCategory","CS"],
    [0x0072,0x0604,"SortingDirection","CS"],
    [0x0072,0x0700,"DisplaySetPatientOrientation","CS"],
    [0x0072,0x0702,"VOIType","CS"],
    [0x0072,0x0704,"PseudoColorType","CS"],
    [0x0072,0x0705,"PseudoColorPaletteInstanceReferenceSequence","SQ"],
    [0x0072,0x0706,"ShowGrayscaleInverted","CS"],
    [0x0072,0x0710,"ShowImageTrueSizeFlag","CS"],
    [0x0072,0x0712,"ShowGraphicAnnotationFlag","CS"],
    [0x0072,0x0714,"ShowPatientDemographicsFlag","CS"],
    [0x0072,0x0716,"ShowAcquisitionTechniquesFlag","CS"],
    [0x0072,0x0717,"DisplaySetHorizontalJustification","CS"],
    [0x0072,0x0718,"DisplaySetVerticalJustification","CS"],
    [0x0074,0x0120,"ContinuationStartMeterset","FD"],
    [0x0074,0x0121,"ContinuationEndMeterset","FD"],
    [0x0074,0x1000,"ProcedureStepState","CS"],
    [0x0074,0x1002,"ProcedureStepProgressInformationSequence","SQ"],
    [0x0074,0x1004,"ProcedureStepProgress","DS"],
    [0x0074,0x1006,"ProcedureStepProgressDescription","ST"],
    [0x0074,0x1008,"ProcedureStepCommunicationsURISequence","SQ"],
    [0x0074,0x100a,"ContactURI","ST"],
    [0x0074,0x100c,"ContactDisplayName","LO"],
    [0x0074,0x100e,"ProcedureStepDiscontinuationReasonCodeSequence","SQ"],
    [0x0074,0x1020,"BeamTaskSequence","SQ"],
    [0x0074,0x1022,"BeamTaskType","CS"],
    [0x0074,0x1024,"BeamOrderIndexTrial","IS"],
    [0x0074,0x1026,"TableTopVerticalAdjustedPosition","FD"],
    [0x0074,0x1027,"TableTopLongitudinalAdjustedPosition","FD"],
    [0x0074,0x1028,"TableTopLateralAdjustedPosition","FD"],
    [0x0074,0x102A,"PatientSupportAdjustedAngle","FD"],
    [0x0074,0x102B,"TableTopEccentricAdjustedAngle","FD"],
    [0x0074,0x102C,"TableTopPitchAdjustedAngle","FD"],
    [0x0074,0x102D,"TableTopRollAdjustedAngle","FD"],
    [0x0074,0x1030,"DeliveryVerificationImageSequence","SQ"],
    [0x0074,0x1032,"VerificationImageTiming","CS"],
    [0x0074,0x1034,"DoubleExposureFlag","CS"],
    [0x0074,0x1036,"DoubleExposureOrdering","CS"],
    [0x0074,0x1038,"DoubleExposureMetersetTrial","DS"],
    [0x0074,0x103A,"DoubleExposureFieldDeltaTrial","DS"],
    [0x0074,0x1040,"RelatedReferenceRTImageSequence","SQ"],
    [0x0074,0x1042,"GeneralMachineVerificationSequence","SQ"],
    [0x0074,0x1044,"ConventionalMachineVerificationSequence","SQ"],
    [0x0074,0x1046,"IonMachineVerificationSequence","SQ"],
    [0x0074,0x1048,"FailedAttributesSequence","SQ"],
    [0x0074,0x104A,"OverriddenAttributesSequence","SQ"],
    [0x0074,0x104C,"ConventionalControlPointVerificationSequence","SQ"],
    [0x0074,0x104E,"IonControlPointVerificationSequence","SQ"],
    [0x0074,0x1050,"AttributeOccurrenceSequence","SQ"],
    [0x0074,0x1052,"AttributeOccurrencePointer","AT"],
    [0x0074,0x1054,"AttributeItemSelector","UL"],
    [0x0074,0x1056,"AttributeOccurrencePrivateCreator","LO"],
    [0x0074,0x1057,"SelectorSequencePointerItems","IS"],
    [0x0074,0x1200,"ScheduledProcedureStepPriority","CS"],
    [0x0074,0x1202,"WorklistLabel","LO"],
    [0x0074,0x1204,"ProcedureStepLabel","LO"],
    [0x0074,0x1210,"ScheduledProcessingParametersSequence","SQ"],
    [0x0074,0x1212,"PerformedProcessingParametersSequence","SQ"],
    [0x0074,0x1216,"UnifiedProcedureStepPerformedProcedureSequence","SQ"],
    [0x0074,0x1220,"RelatedProcedureStepSequence","SQ"],
    [0x0074,0x1222,"ProcedureStepRelationshipType","LO"],
    [0x0074,0x1224,"ReplacedProcedureStepSequence","SQ"],
    [0x0074,0x1230,"DeletionLock","LO"],
    [0x0074,0x1234,"ReceivingAE","AE"],
    [0x0074,0x1236,"RequestingAE","AE"],
    [0x0074,0x1238,"ReasonForCancellation","LT"],
    [0x0074,0x1242,"SCPStatus","CS"],
    [0x0074,0x1244,"SubscriptionListStatus","CS"],
    [0x0074,0x1246,"UnifiedProcedureStepListStatus","CS"],
    [0x0074,0x1324,"BeamOrderIndex","UL"],
    [0x0074,0x1338,"DoubleExposureMeterset","FD"],
    [0x0074,0x133A,"DoubleExposureFieldDelta","FD"],
    [0x0076,0x0001,"ImplantAssemblyTemplateName","LO"],
    [0x0076,0x0003,"ImplantAssemblyTemplateIssuer","LO"],
    [0x0076,0x0006,"ImplantAssemblyTemplateVersion","LO"],
    [0x0076,0x0008,"ReplacedImplantAssemblyTemplateSequence","SQ"],
    [0x0076,0x000A,"ImplantAssemblyTemplateType","CS"],
    [0x0076,0x000C,"OriginalImplantAssemblyTemplateSequence","SQ"],
    [0x0076,0x000E,"DerivationImplantAssemblyTemplateSequence","SQ"],
    [0x0076,0x0010,"ImplantAssemblyTemplateTargetAnatomySequence","SQ"],
    [0x0076,0x0020,"ProcedureTypeCodeSequence","SQ"],
    [0x0076,0x0030,"SurgicalTechnique","LO"],
    [0x0076,0x0032,"ComponentTypesSequence","SQ"],
    [0x0076,0x0034,"ComponentTypeCodeSequence","CS"],
    [0x0076,0x0036,"ExclusiveComponentType","CS"],
    [0x0076,0x0038,"MandatoryComponentType","CS"],
    [0x0076,0x0040,"ComponentSequence","SQ"],
    [0x0076,0x0055,"ComponentID","US"],
    [0x0076,0x0060,"ComponentAssemblySequence","SQ"],
    [0x0076,0x0070,"Component1ReferencedID","US"],
    [0x0076,0x0080,"Component1ReferencedMatingFeatureSetID","US"],
    [0x0076,0x0090,"Component1ReferencedMatingFeatureID","US"],
    [0x0076,0x00A0,"Component2ReferencedID","US"],
    [0x0076,0x00B0,"Component2ReferencedMatingFeatureSetID","US"],
    [0x0076,0x00C0,"Component2ReferencedMatingFeatureID","US"],
    [0x0078,0x0001,"ImplantTemplateGroupName","LO"],
    [0x0078,0x0010,"ImplantTemplateGroupDescription","ST"],
    [0x0078,0x0020,"ImplantTemplateGroupIssuer","LO"],
    [0x0078,0x0024,"ImplantTemplateGroupVersion","LO"],
    [0x0078,0x0026,"ReplacedImplantTemplateGroupSequence","SQ"],
    [0x0078,0x0028,"ImplantTemplateGroupTargetAnatomySequence","SQ"],
    [0x0078,0x002A,"ImplantTemplateGroupMembersSequence","SQ"],
    [0x0078,0x002E,"ImplantTemplateGroupMemberID","US"],
    [0x0078,0x0050,"ThreeDImplantTemplateGroupMemberMatchingPoint","FD"],
    [0x0078,0x0060,"ThreeDImplantTemplateGroupMemberMatchingAxes","FD"],
    [0x0078,0x0070,"ImplantTemplateGroupMemberMatching2DCoordinatesSequence","SQ"],
    [0x0078,0x0090,"TwoDImplantTemplateGroupMemberMatchingPoint","FD"],
    [0x0078,0x00A0,"TwoDImplantTemplateGroupMemberMatchingAxes","FD"],
    [0x0078,0x00B0,"ImplantTemplateGroupVariationDimensionSequence","SQ"],
    [0x0078,0x00B2,"ImplantTemplateGroupVariationDimensionName","LO"],
    [0x0078,0x00B4,"ImplantTemplateGroupVariationDimensionRankSequence","SQ"],
    [0x0078,0x00B6,"ReferencedImplantTemplateGroupMemberID","US"],
    [0x0078,0x00B8,"ImplantTemplateGroupVariationDimensionRank","US"],
    [0x0088,0x0130,"StorageMediaFileSetID","SH"],
    [0x0088,0x0140,"StorageMediaFileSetUID","UI"],
    [0x0088,0x0200,"IconImageSequence","SQ"],
    [0x0088,0x0904,"TopicTitle","LO"],
    [0x0088,0x0906,"TopicSubject","ST"],
    [0x0088,0x0910,"TopicAuthor","LO"],
    [0x0088,0x0912,"TopicKeywords","LO"],
    [0x0100,0x0410,"SOPInstanceStatus","CS"],
    [0x0100,0x0420,"SOPAuthorizationDateTime","DT"],
    [0x0100,0x0424,"SOPAuthorizationComment","LT"],
    [0x0100,0x0426,"AuthorizationEquipmentCertificationNumber","LO"],
    [0x0400,0x0005,"MACIDNumber","US"],
    [0x0400,0x0010,"MACCalculationTransferSyntaxUID","UI"],
    [0x0400,0x0015,"MACAlgorithm","CS"],
    [0x0400,0x0020,"DataElementsSigned","AT"],
    [0x0400,0x0100,"DigitalSignatureUID","UI"],
    [0x0400,0x0105,"DigitalSignatureDateTime","DT"],
    [0x0400,0x0110,"CertificateType","CS"],
    [0x0400,0x0115,"CertificateOfSigner","OB"],
    [0x0400,0x0120,"Signature","OB"],
    [0x0400,0x0305,"CertifiedTimestampType","CS"],
    [0x0400,0x0310,"CertifiedTimestamp","OB"],
    [0x0400,0x0401,"DigitalSignaturePurposeCodeSequence","SQ"],
    [0x0400,0x0402,"ReferencedDigitalSignatureSequence","SQ"],
    [0x0400,0x0403,"ReferencedSOPInstanceMACSequence","SQ"],
    [0x0400,0x0404,"MAC","OB"],
    [0x0400,0x0500,"EncryptedAttributesSequence","SQ"],
    [0x0400,0x0510,"EncryptedContentTransferSyntaxUID","UI"],
    [0x0400,0x0520,"EncryptedContent","OB"],
    [0x0400,0x0550,"ModifiedAttributesSequence","SQ"],
    [0x0400,0x0561,"OriginalAttributesSequence","SQ"],
    [0x0400,0x0562,"AttributeModificationDateTime","DT"],
    [0x0400,0x0563,"ModifyingSystem","LO"],
    [0x0400,0x0564,"SourceOfPreviousValues","LO"],
    [0x0400,0x0565,"ReasonForTheAttributeModification","CS"],
    [0x2000,0x0010,"NumberOfCopies","IS"],
    [0x2000,0x001E,"PrinterConfigurationSequence","SQ"],
    [0x2000,0x0020,"PrintPriority","CS"],
    [0x2000,0x0030,"MediumType","CS"],
    [0x2000,0x0040,"FilmDestination","CS"],
    [0x2000,0x0050,"FilmSessionLabel","LO"],
    [0x2000,0x0060,"MemoryAllocation","IS"],
    [0x2000,0x0061,"MaximumMemoryAllocation","IS"],
    [0x2000,0x0062,"ColorImagePrintingFlag","CS"],
    [0x2000,0x0063,"CollationFlag","CS"],
    [0x2000,0x0065,"AnnotationFlag","CS"],
    [0x2000,0x0067,"ImageOverlayFlag","CS"],
    [0x2000,0x0069,"PresentationLUTFlag","CS"],
    [0x2000,0x006A,"ImageBoxPresentationLUTFlag","CS"],
    [0x2000,0x00A0,"MemoryBitDepth","US"],
    [0x2000,0x00A1,"PrintingBitDepth","US"],
    [0x2000,0x00A2,"MediaInstalledSequence","SQ"],
    [0x2000,0x00A4,"OtherMediaAvailableSequence","SQ"],
    [0x2000,0x00A8,"SupportedImageDisplayFormatsSequence","SQ"],
    [0x2000,0x0500,"ReferencedFilmBoxSequence","SQ"],
    [0x2000,0x0510,"ReferencedStoredPrintSequence","SQ"],
    [0x2010,0x0010,"ImageDisplayFormat","ST"],
    [0x2010,0x0030,"AnnotationDisplayFormatID","CS"],
    [0x2010,0x0040,"FilmOrientation","CS"],
    [0x2010,0x0050,"FilmSizeID","CS"],
    [0x2010,0x0052,"PrinterResolutionID","CS"],
    [0x2010,0x0054,"DefaultPrinterResolutionID","CS"],
    [0x2010,0x0060,"MagnificationType","CS"],
    [0x2010,0x0080,"SmoothingType","CS"],
    [0x2010,0x00A6,"DefaultMagnificationType","CS"],
    [0x2010,0x00A7,"OtherMagnificationTypesAvailable","CS"],
    [0x2010,0x00A8,"DefaultSmoothingType","CS"],
    [0x2010,0x00A9,"OtherSmoothingTypesAvailable","CS"],
    [0x2010,0x0100,"BorderDensity","CS"],
    [0x2010,0x0110,"EmptyImageDensity","CS"],
    [0x2010,0x0120,"MinDensity","US"],
    [0x2010,0x0130,"MaxDensity","US"],
    [0x2010,0x0140,"Trim","CS"],
    [0x2010,0x0150,"ConfigurationInformation","ST"],
    [0x2010,0x0152,"ConfigurationInformationDescription","LT"],
    [0x2010,0x0154,"MaximumCollatedFilms","IS"],
    [0x2010,0x015E,"Illumination","US"],
    [0x2010,0x0160,"ReflectedAmbientLight","US"],
    [0x2010,0x0376,"PrinterPixelSpacing","DS"],
    [0x2010,0x0500,"ReferencedFilmSessionSequence","SQ"],
    [0x2010,0x0510,"ReferencedImageBoxSequence","SQ"],
    [0x2010,0x0520,"ReferencedBasicAnnotationBoxSequence","SQ"],
    [0x2020,0x0010,"ImageBoxPosition","US"],
    [0x2020,0x0020,"Polarity","CS"],
    [0x2020,0x0030,"RequestedImageSize","DS"],
    [0x2020,0x0040,"RequestedDecimateCropBehavior","CS"],
    [0x2020,0x0050,"RequestedResolutionID","CS"],
    [0x2020,0x00A0,"RequestedImageSizeFlag","CS"],
    [0x2020,0x00A2,"DecimateCropResult","CS"],
    [0x2020,0x0110,"BasicGrayscaleImageSequence","SQ"],
    [0x2020,0x0111,"BasicColorImageSequence","SQ"],
    [0x2020,0x0130,"ReferencedImageOverlayBoxSequence","SQ"],
    [0x2020,0x0140,"ReferencedVOILUTBoxSequence","SQ"],
    [0x2030,0x0010,"AnnotationPosition","US"],
    [0x2030,0x0020,"TextString","LO"],
    [0x2040,0x0010,"ReferencedOverlayPlaneSequence","SQ"],
    [0x2040,0x0011,"ReferencedOverlayPlaneGroups","US"],
    [0x2040,0x0020,"OverlayPixelDataSequence","SQ"],
    [0x2040,0x0060,"OverlayMagnificationType","CS"],
    [0x2040,0x0070,"OverlaySmoothingType","CS"],
    [0x2040,0x0072,"OverlayOrImageMagnification","CS"],
    [0x2040,0x0074,"MagnifyToNumberOfColumns","US"],
    [0x2040,0x0080,"OverlayForegroundDensity","CS"],
    [0x2040,0x0082,"OverlayBackgroundDensity","CS"],
    [0x2040,0x0090,"OverlayMode","CS"],
    [0x2040,0x0100,"ThresholdDensity","CS"],
    [0x2040,0x0500,"ReferencedImageBoxSequenceRetired","SQ"],
    [0x2050,0x0010,"PresentationLUTSequence","SQ"],
    [0x2050,0x0020,"PresentationLUTShape","CS"],
    [0x2050,0x0500,"ReferencedPresentationLUTSequence","SQ"],
    [0x2100,0x0010,"PrintJobID","SH"],
    [0x2100,0x0020,"ExecutionStatus","CS"],
    [0x2100,0x0030,"ExecutionStatusInfo","CS"],
    [0x2100,0x0040,"CreationDate","DA"],
    [0x2100,0x0050,"CreationTime","TM"],
    [0x2100,0x0070,"Originator","AE"],
    [0x2100,0x0140,"DestinationAE","AE"],
    [0x2100,0x0160,"OwnerID","SH"],
    [0x2100,0x0170,"NumberOfFilms","IS"],
    [0x2100,0x0500,"ReferencedPrintJobSequencePullStoredPrint","SQ"],
    [0x2110,0x0010,"PrinterStatus","CS"],
    [0x2110,0x0020,"PrinterStatusInfo","CS"],
    [0x2110,0x0030,"PrinterName","LO"],
    [0x2110,0x0099,"PrintQueueID","SH"],
    [0x2120,0x0010,"QueueStatus","CS"],
    [0x2120,0x0050,"PrintJobDescriptionSequence","SQ"],
    [0x2120,0x0070,"ReferencedPrintJobSequence","SQ"],
    [0x2130,0x0010,"PrintManagementCapabilitiesSequence","SQ"],
    [0x2130,0x0015,"PrinterCharacteristicsSequence","SQ"],
    [0x2130,0x0030,"FilmBoxContentSequence","SQ"],
    [0x2130,0x0040,"ImageBoxContentSequence","SQ"],
    [0x2130,0x0050,"AnnotationContentSequence","SQ"],
    [0x2130,0x0060,"ImageOverlayBoxContentSequence","SQ"],
    [0x2130,0x0080,"PresentationLUTContentSequence","SQ"],
    [0x2130,0x00A0,"ProposedStudySequence","SQ"],
    [0x2130,0x00C0,"OriginalImageSequence","SQ"],
    [0x2200,0x0001,"LabelUsingInformationExtractedFromInstances","CS"],
    [0x2200,0x0002,"LabelText","UT"],
    [0x2200,0x0003,"LabelStyleSelection","CS"],
    [0x2200,0x0004,"MediaDisposition","LT"],
    [0x2200,0x0005,"BarcodeValue","LT"],
    [0x2200,0x0006,"BarcodeSymbology","CS"],
    [0x2200,0x0007,"AllowMediaSplitting","CS"],
    [0x2200,0x0008,"IncludeNonDICOMObjects","CS"],
    [0x2200,0x0009,"IncludeDisplayApplication","CS"],
    [0x2200,0x000A,"PreserveCompositeInstancesAfterMediaCreation","CS"],
    [0x2200,0x000B,"TotalNumberOfPiecesOfMediaCreated","US"],
    [0x2200,0x000C,"RequestedMediaApplicationProfile","LO"],
    [0x2200,0x000D,"ReferencedStorageMediaSequence","SQ"],
    [0x2200,0x000E,"FailureAttributes","AT"],
    [0x2200,0x000F,"AllowLossyCompression","CS"],
    [0x2200,0x0020,"RequestPriority","CS"],
    [0x3002,0x0002,"RTImageLabel","SH"],
    [0x3002,0x0003,"RTImageName","LO"],
    [0x3002,0x0004,"RTImageDescription","ST"],
    [0x3002,0x000A,"ReportedValuesOrigin","CS"],
    [0x3002,0x000C,"RTImagePlane","CS"],
    [0x3002,0x000D,"XRayImageReceptorTranslation","DS"],
    [0x3002,0x000E,"XRayImageReceptorAngle","DS"],
    [0x3002,0x0010,"RTImageOrientation","DS"],
    [0x3002,0x0011,"ImagePlanePixelSpacing","DS"],
    [0x3002,0x0012,"RTImagePosition","DS"],
    [0x3002,0x0020,"RadiationMachineName","SH"],
    [0x3002,0x0022,"RadiationMachineSAD","DS"],
    [0x3002,0x0024,"RadiationMachineSSD","DS"],
    [0x3002,0x0026,"RTImageSID","DS"],
    [0x3002,0x0028,"SourceToReferenceObjectDistance","DS"],
    [0x3002,0x0029,"FractionNumber","IS"],
    [0x3002,0x0030,"ExposureSequence","SQ"],
    [0x3002,0x0032,"MetersetExposure","DS"],
    [0x3002,0x0034,"DiaphragmPosition","DS"],
    [0x3002,0x0040,"FluenceMapSequence","SQ"],
    [0x3002,0x0041,"FluenceDataSource","CS"],
    [0x3002,0x0042,"FluenceDataScale","DS"],
    [0x3002,0x0050,"PrimaryFluenceModeSequence","SQ"],
    [0x3002,0x0051,"FluenceMode","CS"],
    [0x3002,0x0052,"FluenceModeID","SH"],
    [0x3004,0x0001,"DVHType","CS"],
    [0x3004,0x0002,"DoseUnits","CS"],
    [0x3004,0x0004,"DoseType","CS"],
    [0x3004,0x0006,"DoseComment","LO"],
    [0x3004,0x0008,"NormalizationPoint","DS"],
    [0x3004,0x000A,"DoseSummationType","CS"],
    [0x3004,0x000C,"GridFrameOffsetVector","DS"],
    [0x3004,0x000E,"DoseGridScaling","DS"],
    [0x3004,0x0010,"RTDoseROISequence","SQ"],
    [0x3004,0x0012,"DoseValue","DS"],
    [0x3004,0x0014,"TissueHeterogeneityCorrection","CS"],
    [0x3004,0x0040,"DVHNormalizationPoint","DS"],
    [0x3004,0x0042,"DVHNormalizationDoseValue","DS"],
    [0x3004,0x0050,"DVHSequence","SQ"],
    [0x3004,0x0052,"DVHDoseScaling","DS"],
    [0x3004,0x0054,"DVHVolumeUnits","CS"],
    [0x3004,0x0056,"DVHNumberOfBins","IS"],
    [0x3004,0x0058,"DVHData","DS"],
    [0x3004,0x0060,"DVHReferencedROISequence","SQ"],
    [0x3004,0x0062,"DVHROIContributionType","CS"],
    [0x3004,0x0070,"DVHMinimumDose","DS"],
    [0x3004,0x0072,"DVHMaximumDose","DS"],
    [0x3004,0x0074,"DVHMeanDose","DS"],
    [0x3006,0x0002,"StructureSetLabel","SH"],
    [0x3006,0x0004,"StructureSetName","LO"],
    [0x3006,0x0006,"StructureSetDescription","ST"],
    [0x3006,0x0008,"StructureSetDate","DA"],
    [0x3006,0x0009,"StructureSetTime","TM"],
    [0x3006,0x0010,"ReferencedFrameOfReferenceSequence","SQ"],
    [0x3006,0x0012,"RTReferencedStudySequence","SQ"],
    [0x3006,0x0014,"RTReferencedSeriesSequence","SQ"],
    [0x3006,0x0016,"ContourImageSequence","SQ"],
    [0x3006,0x0020,"StructureSetROISequence","SQ"],
    [0x3006,0x0022,"ROINumber","IS"],
    [0x3006,0x0024,"ReferencedFrameOfReferenceUID","UI"],
    [0x3006,0x0026,"ROIName","LO"],
    [0x3006,0x0028,"ROIDescription","ST"],
    [0x3006,0x002A,"ROIDisplayColor","IS"],
    [0x3006,0x002C,"ROIVolume","DS"],
    [0x3006,0x0030,"RTRelatedROISequence","SQ"],
    [0x3006,0x0033,"RTROIRelationship","CS"],
    [0x3006,0x0036,"ROIGenerationAlgorithm","CS"],
    [0x3006,0x0038,"ROIGenerationDescription","LO"],
    [0x3006,0x0039,"ROIContourSequence","SQ"],
    [0x3006,0x0040,"ContourSequence","SQ"],
    [0x3006,0x0042,"ContourGeometricType","CS"],
    [0x3006,0x0044,"ContourSlabThickness","DS"],
    [0x3006,0x0045,"ContourOffsetVector","DS"],
    [0x3006,0x0046,"NumberOfContourPoints","IS"],
    [0x3006,0x0048,"ContourNumber","IS"],
    [0x3006,0x0049,"AttachedContours","IS"],
    [0x3006,0x0050,"ContourData","DS"],
    [0x3006,0x0080,"RTROIObservationsSequence","SQ"],
    [0x3006,0x0082,"ObservationNumber","IS"],
    [0x3006,0x0084,"ReferencedROINumber","IS"],
    [0x3006,0x0085,"ROIObservationLabel","SH"],
    [0x3006,0x0086,"RTROIIdentificationCodeSequence","SQ"],
    [0x3006,0x0088,"ROIObservationDescription","ST"],
    [0x3006,0x00A0,"RelatedRTROIObservationsSequence","SQ"],
    [0x3006,0x00A4,"RTROIInterpretedType","CS"],
    [0x3006,0x00A6,"ROIInterpreter","PN"],
    [0x3006,0x00B0,"ROIPhysicalPropertiesSequence","SQ"],
    [0x3006,0x00B2,"ROIPhysicalProperty","CS"],
    [0x3006,0x00B4,"ROIPhysicalPropertyValue","DS"],
    [0x3006,0x00B6,"ROIElementalCompositionSequence","SQ"],
    [0x3006,0x00B7,"ROIElementalCompositionAtomicNumber","US"],
    [0x3006,0x00B8,"ROIElementalCompositionAtomicMassFraction","FL"],
    [0x3006,0x00C0,"FrameOfReferenceRelationshipSequence","SQ"],
    [0x3006,0x00C2,"RelatedFrameOfReferenceUID","UI"],
    [0x3006,0x00C4,"FrameOfReferenceTransformationType","CS"],
    [0x3006,0x00C6,"FrameOfReferenceTransformationMatrix","DS"],
    [0x3006,0x00C8,"FrameOfReferenceTransformationComment","LO"],
    [0x3008,0x0010,"MeasuredDoseReferenceSequence","SQ"],
    [0x3008,0x0012,"MeasuredDoseDescription","ST"],
    [0x3008,0x0014,"MeasuredDoseType","CS"],
    [0x3008,0x0016,"MeasuredDoseValue","DS"],
    [0x3008,0x0020,"TreatmentSessionBeamSequence","SQ"],
    [0x3008,0x0021,"TreatmentSessionIonBeamSequence","SQ"],
    [0x3008,0x0022,"CurrentFractionNumber","IS"],
    [0x3008,0x0024,"TreatmentControlPointDate","DA"],
    [0x3008,0x0025,"TreatmentControlPointTime","TM"],
    [0x3008,0x002A,"TreatmentTerminationStatus","CS"],
    [0x3008,0x002B,"TreatmentTerminationCode","SH"],
    [0x3008,0x002C,"TreatmentVerificationStatus","CS"],
    [0x3008,0x0030,"ReferencedTreatmentRecordSequence","SQ"],
    [0x3008,0x0032,"SpecifiedPrimaryMeterset","DS"],
    [0x3008,0x0033,"SpecifiedSecondaryMeterset","DS"],
    [0x3008,0x0036,"DeliveredPrimaryMeterset","DS"],
    [0x3008,0x0037,"DeliveredSecondaryMeterset","DS"],
    [0x3008,0x003A,"SpecifiedTreatmentTime","DS"],
    [0x3008,0x003B,"DeliveredTreatmentTime","DS"],
    [0x3008,0x0040,"ControlPointDeliverySequence","SQ"],
    [0x3008,0x0041,"IonControlPointDeliverySequence","SQ"],
    [0x3008,0x0042,"SpecifiedMeterset","DS"],
    [0x3008,0x0044,"DeliveredMeterset","DS"],
    [0x3008,0x0045,"MetersetRateSet","FL"],
    [0x3008,0x0046,"MetersetRateDelivered","FL"],
    [0x3008,0x0047,"ScanSpotMetersetsDelivered","FL"],
    [0x3008,0x0048,"DoseRateDelivered","DS"],
    [0x3008,0x0050,"TreatmentSummaryCalculatedDoseReferenceSequence","SQ"],
    [0x3008,0x0052,"CumulativeDoseToDoseReference","DS"],
    [0x3008,0x0054,"FirstTreatmentDate","DA"],
    [0x3008,0x0056,"MostRecentTreatmentDate","DA"],
    [0x3008,0x005A,"NumberOfFractionsDelivered","IS"],
    [0x3008,0x0060,"OverrideSequence","SQ"],
    [0x3008,0x0061,"ParameterSequencePointer","AT"],
    [0x3008,0x0062,"OverrideParameterPointer","AT"],
    [0x3008,0x0063,"ParameterItemIndex","IS"],
    [0x3008,0x0064,"MeasuredDoseReferenceNumber","IS"],
    [0x3008,0x0065,"ParameterPointer","AT"],
    [0x3008,0x0066,"OverrideReason","ST"],
    [0x3008,0x0068,"CorrectedParameterSequence","SQ"],
    [0x3008,0x006A,"CorrectionValue","FL"],
    [0x3008,0x0070,"CalculatedDoseReferenceSequence","SQ"],
    [0x3008,0x0072,"CalculatedDoseReferenceNumber","IS"],
    [0x3008,0x0074,"CalculatedDoseReferenceDescription","ST"],
    [0x3008,0x0076,"CalculatedDoseReferenceDoseValue","DS"],
    [0x3008,0x0078,"StartMeterset","DS"],
    [0x3008,0x007A,"EndMeterset","DS"],
    [0x3008,0x0080,"ReferencedMeasuredDoseReferenceSequence","SQ"],
    [0x3008,0x0082,"ReferencedMeasuredDoseReferenceNumber","IS"],
    [0x3008,0x0090,"ReferencedCalculatedDoseReferenceSequence","SQ"],
    [0x3008,0x0092,"ReferencedCalculatedDoseReferenceNumber","IS"],
    [0x3008,0x00A0,"BeamLimitingDeviceLeafPairsSequence","SQ"],
    [0x3008,0x00B0,"RecordedWedgeSequence","SQ"],
    [0x3008,0x00C0,"RecordedCompensatorSequence","SQ"],
    [0x3008,0x00D0,"RecordedBlockSequence","SQ"],
    [0x3008,0x00E0,"TreatmentSummaryMeasuredDoseReferenceSequence","SQ"],
    [0x3008,0x00F0,"RecordedSnoutSequence","SQ"],
    [0x3008,0x00F2,"RecordedRangeShifterSequence","SQ"],
    [0x3008,0x00F4,"RecordedLateralSpreadingDeviceSequence","SQ"],
    [0x3008,0x00F6,"RecordedRangeModulatorSequence","SQ"],
    [0x3008,0x0100,"RecordedSourceSequence","SQ"],
    [0x3008,0x0105,"SourceSerialNumber","LO"],
    [0x3008,0x0110,"TreatmentSessionApplicationSetupSequence","SQ"],
    [0x3008,0x0116,"ApplicationSetupCheck","CS"],
    [0x3008,0x0120,"RecordedBrachyAccessoryDeviceSequence","SQ"],
    [0x3008,0x0122,"ReferencedBrachyAccessoryDeviceNumber","IS"],
    [0x3008,0x0130,"RecordedChannelSequence","SQ"],
    [0x3008,0x0132,"SpecifiedChannelTotalTime","DS"],
    [0x3008,0x0134,"DeliveredChannelTotalTime","DS"],
    [0x3008,0x0136,"SpecifiedNumberOfPulses","IS"],
    [0x3008,0x0138,"DeliveredNumberOfPulses","IS"],
    [0x3008,0x013A,"SpecifiedPulseRepetitionInterval","DS"],
    [0x3008,0x013C,"DeliveredPulseRepetitionInterval","DS"],
    [0x3008,0x0140,"RecordedSourceApplicatorSequence","SQ"],
    [0x3008,0x0142,"ReferencedSourceApplicatorNumber","IS"],
    [0x3008,0x0150,"RecordedChannelShieldSequence","SQ"],
    [0x3008,0x0152,"ReferencedChannelShieldNumber","IS"],
    [0x3008,0x0160,"BrachyControlPointDeliveredSequence","SQ"],
    [0x3008,0x0162,"SafePositionExitDate","DA"],
    [0x3008,0x0164,"SafePositionExitTime","TM"],
    [0x3008,0x0166,"SafePositionReturnDate","DA"],
    [0x3008,0x0168,"SafePositionReturnTime","TM"],
    [0x3008,0x0200,"CurrentTreatmentStatus","CS"],
    [0x3008,0x0202,"TreatmentStatusComment","ST"],
    [0x3008,0x0220,"FractionGroupSummarySequence","SQ"],
    [0x3008,0x0223,"ReferencedFractionNumber","IS"],
    [0x3008,0x0224,"FractionGroupType","CS"],
    [0x3008,0x0230,"BeamStopperPosition","CS"],
    [0x3008,0x0240,"FractionStatusSummarySequence","SQ"],
    [0x3008,0x0250,"TreatmentDate","DA"],
    [0x3008,0x0251,"TreatmentTime","TM"],
    [0x300A,0x0002,"RTPlanLabel","SH"],
    [0x300A,0x0003,"RTPlanName","LO"],
    [0x300A,0x0004,"RTPlanDescription","ST"],
    [0x300A,0x0006,"RTPlanDate","DA"],
    [0x300A,0x0007,"RTPlanTime","TM"],
    [0x300A,0x0009,"TreatmentProtocols","LO"],
    [0x300A,0x000A,"PlanIntent","CS"],
    [0x300A,0x000B,"TreatmentSites","LO"],
    [0x300A,0x000C,"RTPlanGeometry","CS"],
    [0x300A,0x000E,"PrescriptionDescription","ST"],
    [0x300A,0x0010,"DoseReferenceSequence","SQ"],
    [0x300A,0x0012,"DoseReferenceNumber","IS"],
    [0x300A,0x0013,"DoseReferenceUID","UI"],
    [0x300A,0x0014,"DoseReferenceStructureType","CS"],
    [0x300A,0x0015,"NominalBeamEnergyUnit","CS"],
    [0x300A,0x0016,"DoseReferenceDescription","LO"],
    [0x300A,0x0018,"DoseReferencePointCoordinates","DS"],
    [0x300A,0x001A,"NominalPriorDose","DS"],
    [0x300A,0x0020,"DoseReferenceType","CS"],
    [0x300A,0x0021,"ConstraintWeight","DS"],
    [0x300A,0x0022,"DeliveryWarningDose","DS"],
    [0x300A,0x0023,"DeliveryMaximumDose","DS"],
    [0x300A,0x0025,"TargetMinimumDose","DS"],
    [0x300A,0x0026,"TargetPrescriptionDose","DS"],
    [0x300A,0x0027,"TargetMaximumDose","DS"],
    [0x300A,0x0028,"TargetUnderdoseVolumeFraction","DS"],
    [0x300A,0x002A,"OrganAtRiskFullVolumeDose","DS"],
    [0x300A,0x002B,"OrganAtRiskLimitDose","DS"],
    [0x300A,0x002C,"OrganAtRiskMaximumDose","DS"],
    [0x300A,0x002D,"OrganAtRiskOverdoseVolumeFraction","DS"],
    [0x300A,0x0040,"ToleranceTableSequence","SQ"],
    [0x300A,0x0042,"ToleranceTableNumber","IS"],
    [0x300A,0x0043,"ToleranceTableLabel","SH"],
    [0x300A,0x0044,"GantryAngleTolerance","DS"],
    [0x300A,0x0046,"BeamLimitingDeviceAngleTolerance","DS"],
    [0x300A,0x0048,"BeamLimitingDeviceToleranceSequence","SQ"],
    [0x300A,0x004A,"BeamLimitingDevicePositionTolerance","DS"],
    [0x300A,0x004B,"SnoutPositionTolerance","FL"],
    [0x300A,0x004C,"PatientSupportAngleTolerance","DS"],
    [0x300A,0x004E,"TableTopEccentricAngleTolerance","DS"],
    [0x300A,0x004F,"TableTopPitchAngleTolerance","FL"],
    [0x300A,0x0050,"TableTopRollAngleTolerance","FL"],
    [0x300A,0x0051,"TableTopVerticalPositionTolerance","DS"],
    [0x300A,0x0052,"TableTopLongitudinalPositionTolerance","DS"],
    [0x300A,0x0053,"TableTopLateralPositionTolerance","DS"],
    [0x300A,0x0055,"RTPlanRelationship","CS"],
    [0x300A,0x0070,"FractionGroupSequence","SQ"],
    [0x300A,0x0071,"FractionGroupNumber","IS"],
    [0x300A,0x0072,"FractionGroupDescription","LO"],
    [0x300A,0x0078,"NumberOfFractionsPlanned","IS"],
    [0x300A,0x0079,"NumberOfFractionPatternDigitsPerDay","IS"],
    [0x300A,0x007A,"RepeatFractionCycleLength","IS"],
    [0x300A,0x007B,"FractionPattern","LT"],
    [0x300A,0x0080,"NumberOfBeams","IS"],
    [0x300A,0x0082,"BeamDoseSpecificationPoint","DS"],
    [0x300A,0x0084,"BeamDose","DS"],
    [0x300A,0x0086,"BeamMeterset","DS"],
    [0x300A,0x0088,"BeamDosePointDepth","FL"],
    [0x300A,0x0089,"BeamDosePointEquivalentDepth","FL"],
    [0x300A,0x008A,"BeamDosePointSSD","FL"],
    [0x300A,0x00A0,"NumberOfBrachyApplicationSetups","IS"],
    [0x300A,0x00A2,"BrachyApplicationSetupDoseSpecificationPoint","DS"],
    [0x300A,0x00A4,"BrachyApplicationSetupDose","DS"],
    [0x300A,0x00B0,"BeamSequence","SQ"],
    [0x300A,0x00B2,"TreatmentMachineName","SH"],
    [0x300A,0x00B3,"PrimaryDosimeterUnit","CS"],
    [0x300A,0x00B4,"SourceAxisDistance","DS"],
    [0x300A,0x00B6,"BeamLimitingDeviceSequence","SQ"],
    [0x300A,0x00B8,"RTBeamLimitingDeviceType","CS"],
    [0x300A,0x00BA,"SourceToBeamLimitingDeviceDistance","DS"],
    [0x300A,0x00BB,"IsocenterToBeamLimitingDeviceDistance","FL"],
    [0x300A,0x00BC,"NumberOfLeafJawPairs","IS"],
    [0x300A,0x00BE,"LeafPositionBoundaries","DS"],
    [0x300A,0x00C0,"BeamNumber","IS"],
    [0x300A,0x00C2,"BeamName","LO"],
    [0x300A,0x00C3,"BeamDescription","ST"],
    [0x300A,0x00C4,"BeamType","CS"],
    [0x300A,0x00C6,"RadiationType","CS"],
    [0x300A,0x00C7,"HighDoseTechniqueType","CS"],
    [0x300A,0x00C8,"ReferenceImageNumber","IS"],
    [0x300A,0x00CA,"PlannedVerificationImageSequence","SQ"],
    [0x300A,0x00CC,"ImagingDeviceSpecificAcquisitionParameters","LO"],
    [0x300A,0x00CE,"TreatmentDeliveryType","CS"],
    [0x300A,0x00D0,"NumberOfWedges","IS"],
    [0x300A,0x00D1,"WedgeSequence","SQ"],
    [0x300A,0x00D2,"WedgeNumber","IS"],
    [0x300A,0x00D3,"WedgeType","CS"],
    [0x300A,0x00D4,"WedgeID","SH"],
    [0x300A,0x00D5,"WedgeAngle","IS"],
    [0x300A,0x00D6,"WedgeFactor","DS"],
    [0x300A,0x00D7,"TotalWedgeTrayWaterEquivalentThickness","FL"],
    [0x300A,0x00D8,"WedgeOrientation","DS"],
    [0x300A,0x00D9,"IsocenterToWedgeTrayDistance","FL"],
    [0x300A,0x00DA,"SourceToWedgeTrayDistance","DS"],
    [0x300A,0x00DB,"WedgeThinEdgePosition","FL"],
    [0x300A,0x00DC,"BolusID","SH"],
    [0x300A,0x00DD,"BolusDescription","ST"],
    [0x300A,0x00E0,"NumberOfCompensators","IS"],
    [0x300A,0x00E1,"MaterialID","SH"],
    [0x300A,0x00E2,"TotalCompensatorTrayFactor","DS"],
    [0x300A,0x00E3,"CompensatorSequence","SQ"],
    [0x300A,0x00E4,"CompensatorNumber","IS"],
    [0x300A,0x00E5,"CompensatorID","SH"],
    [0x300A,0x00E6,"SourceToCompensatorTrayDistance","DS"],
    [0x300A,0x00E7,"CompensatorRows","IS"],
    [0x300A,0x00E8,"CompensatorColumns","IS"],
    [0x300A,0x00E9,"CompensatorPixelSpacing","DS"],
    [0x300A,0x00EA,"CompensatorPosition","DS"],
    [0x300A,0x00EB,"CompensatorTransmissionData","DS"],
    [0x300A,0x00EC,"CompensatorThicknessData","DS"],
    [0x300A,0x00ED,"NumberOfBoli","IS"],
    [0x300A,0x00EE,"CompensatorType","CS"],
    [0x300A,0x00F0,"NumberOfBlocks","IS"],
    [0x300A,0x00F2,"TotalBlockTrayFactor","DS"],
    [0x300A,0x00F3,"TotalBlockTrayWaterEquivalentThickness","FL"],
    [0x300A,0x00F4,"BlockSequence","SQ"],
    [0x300A,0x00F5,"BlockTrayID","SH"],
    [0x300A,0x00F6,"SourceToBlockTrayDistance","DS"],
    [0x300A,0x00F7,"IsocenterToBlockTrayDistance","FL"],
    [0x300A,0x00F8,"BlockType","CS"],
    [0x300A,0x00F9,"AccessoryCode","LO"],
    [0x300A,0x00FA,"BlockDivergence","CS"],
    [0x300A,0x00FB,"BlockMountingPosition","CS"],
    [0x300A,0x00FC,"BlockNumber","IS"],
    [0x300A,0x00FE,"BlockName","LO"],
    [0x300A,0x0100,"BlockThickness","DS"],
    [0x300A,0x0102,"BlockTransmission","DS"],
    [0x300A,0x0104,"BlockNumberOfPoints","IS"],
    [0x300A,0x0106,"BlockData","DS"],
    [0x300A,0x0107,"ApplicatorSequence","SQ"],
    [0x300A,0x0108,"ApplicatorID","SH"],
    [0x300A,0x0109,"ApplicatorType","CS"],
    [0x300A,0x010A,"ApplicatorDescription","LO"],
    [0x300A,0x010C,"CumulativeDoseReferenceCoefficient","DS"],
    [0x300A,0x010E,"FinalCumulativeMetersetWeight","DS"],
    [0x300A,0x0110,"NumberOfControlPoints","IS"],
    [0x300A,0x0111,"ControlPointSequence","SQ"],
    [0x300A,0x0112,"ControlPointIndex","IS"],
    [0x300A,0x0114,"NominalBeamEnergy","DS"],
    [0x300A,0x0115,"DoseRateSet","DS"],
    [0x300A,0x0116,"WedgePositionSequence","SQ"],
    [0x300A,0x0118,"WedgePosition","CS"],
    [0x300A,0x011A,"BeamLimitingDevicePositionSequence","SQ"],
    [0x300A,0x011C,"LeafJawPositions","DS"],
    [0x300A,0x011E,"GantryAngle","DS"],
    [0x300A,0x011F,"GantryRotationDirection","CS"],
    [0x300A,0x0120,"BeamLimitingDeviceAngle","DS"],
    [0x300A,0x0121,"BeamLimitingDeviceRotationDirection","CS"],
    [0x300A,0x0122,"PatientSupportAngle","DS"],
    [0x300A,0x0123,"PatientSupportRotationDirection","CS"],
    [0x300A,0x0124,"TableTopEccentricAxisDistance","DS"],
    [0x300A,0x0125,"TableTopEccentricAngle","DS"],
    [0x300A,0x0126,"TableTopEccentricRotationDirection","CS"],
    [0x300A,0x0128,"TableTopVerticalPosition","DS"],
    [0x300A,0x0129,"TableTopLongitudinalPosition","DS"],
    [0x300A,0x012A,"TableTopLateralPosition","DS"],
    [0x300A,0x012C,"IsocenterPosition","DS"],
    [0x300A,0x012E,"SurfaceEntryPoint","DS"],
    [0x300A,0x0130,"SourceToSurfaceDistance","DS"],
    [0x300A,0x0134,"CumulativeMetersetWeight","DS"],
    [0x300A,0x0140,"TableTopPitchAngle","FL"],
    [0x300A,0x0142,"TableTopPitchRotationDirection","CS"],
    [0x300A,0x0144,"TableTopRollAngle","FL"],
    [0x300A,0x0146,"TableTopRollRotationDirection","CS"],
    [0x300A,0x0148,"HeadFixationAngle","FL"],
    [0x300A,0x014A,"GantryPitchAngle","FL"],
    [0x300A,0x014C,"GantryPitchRotationDirection","CS"],
    [0x300A,0x014E,"GantryPitchAngleTolerance","FL"],
    [0x300A,0x0180,"PatientSetupSequence","SQ"],
    [0x300A,0x0182,"PatientSetupNumber","IS"],
    [0x300A,0x0183,"PatientSetupLabel","LO"],
    [0x300A,0x0184,"PatientAdditionalPosition","LO"],
    [0x300A,0x0190,"FixationDeviceSequence","SQ"],
    [0x300A,0x0192,"FixationDeviceType","CS"],
    [0x300A,0x0194,"FixationDeviceLabel","SH"],
    [0x300A,0x0196,"FixationDeviceDescription","ST"],
    [0x300A,0x0198,"FixationDevicePosition","SH"],
    [0x300A,0x0199,"FixationDevicePitchAngle","FL"],
    [0x300A,0x019A,"FixationDeviceRollAngle","FL"],
    [0x300A,0x01A0,"ShieldingDeviceSequence","SQ"],
    [0x300A,0x01A2,"ShieldingDeviceType","CS"],
    [0x300A,0x01A4,"ShieldingDeviceLabel","SH"],
    [0x300A,0x01A6,"ShieldingDeviceDescription","ST"],
    [0x300A,0x01A8,"ShieldingDevicePosition","SH"],
    [0x300A,0x01B0,"SetupTechnique","CS"],
    [0x300A,0x01B2,"SetupTechniqueDescription","ST"],
    [0x300A,0x01B4,"SetupDeviceSequence","SQ"],
    [0x300A,0x01B6,"SetupDeviceType","CS"],
    [0x300A,0x01B8,"SetupDeviceLabel","SH"],
    [0x300A,0x01BA,"SetupDeviceDescription","ST"],
    [0x300A,0x01BC,"SetupDeviceParameter","DS"],
    [0x300A,0x01D0,"SetupReferenceDescription","ST"],
    [0x300A,0x01D2,"TableTopVerticalSetupDisplacement","DS"],
    [0x300A,0x01D4,"TableTopLongitudinalSetupDisplacement","DS"],
    [0x300A,0x01D6,"TableTopLateralSetupDisplacement","DS"],
    [0x300A,0x0200,"BrachyTreatmentTechnique","CS"],
    [0x300A,0x0202,"BrachyTreatmentType","CS"],
    [0x300A,0x0206,"TreatmentMachineSequence","SQ"],
    [0x300A,0x0210,"SourceSequence","SQ"],
    [0x300A,0x0212,"SourceNumber","IS"],
    [0x300A,0x0214,"SourceType","CS"],
    [0x300A,0x0216,"SourceManufacturer","LO"],
    [0x300A,0x0218,"ActiveSourceDiameter","DS"],
    [0x300A,0x021A,"ActiveSourceLength","DS"],
    [0x300A,0x0222,"SourceEncapsulationNominalThickness","DS"],
    [0x300A,0x0224,"SourceEncapsulationNominalTransmission","DS"],
    [0x300A,0x0226,"SourceIsotopeName","LO"],
    [0x300A,0x0228,"SourceIsotopeHalfLife","DS"],
    [0x300A,0x0229,"SourceStrengthUnits","CS"],
    [0x300A,0x022A,"ReferenceAirKermaRate","DS"],
    [0x300A,0x022B,"SourceStrength","DS"],
    [0x300A,0x022C,"SourceStrengthReferenceDate","DA"],
    [0x300A,0x022E,"SourceStrengthReferenceTime","TM"],
    [0x300A,0x0230,"ApplicationSetupSequence","SQ"],
    [0x300A,0x0232,"ApplicationSetupType","CS"],
    [0x300A,0x0234,"ApplicationSetupNumber","IS"],
    [0x300A,0x0236,"ApplicationSetupName","LO"],
    [0x300A,0x0238,"ApplicationSetupManufacturer","LO"],
    [0x300A,0x0240,"TemplateNumber","IS"],
    [0x300A,0x0242,"TemplateType","SH"],
    [0x300A,0x0244,"TemplateName","LO"],
    [0x300A,0x0250,"TotalReferenceAirKerma","DS"],
    [0x300A,0x0260,"BrachyAccessoryDeviceSequence","SQ"],
    [0x300A,0x0262,"BrachyAccessoryDeviceNumber","IS"],
    [0x300A,0x0263,"BrachyAccessoryDeviceID","SH"],
    [0x300A,0x0264,"BrachyAccessoryDeviceType","CS"],
    [0x300A,0x0266,"BrachyAccessoryDeviceName","LO"],
    [0x300A,0x026A,"BrachyAccessoryDeviceNominalThickness","DS"],
    [0x300A,0x026C,"BrachyAccessoryDeviceNominalTransmission","DS"],
    [0x300A,0x0280,"ChannelSequence","SQ"],
    [0x300A,0x0282,"ChannelNumber","IS"],
    [0x300A,0x0284,"ChannelLength","DS"],
    [0x300A,0x0286,"ChannelTotalTime","DS"],
    [0x300A,0x0288,"SourceMovementType","CS"],
    [0x300A,0x028A,"NumberOfPulses","IS"],
    [0x300A,0x028C,"PulseRepetitionInterval","DS"],
    [0x300A,0x0290,"SourceApplicatorNumber","IS"],
    [0x300A,0x0291,"SourceApplicatorID","SH"],
    [0x300A,0x0292,"SourceApplicatorType","CS"],
    [0x300A,0x0294,"SourceApplicatorName","LO"],
    [0x300A,0x0296,"SourceApplicatorLength","DS"],
    [0x300A,0x0298,"SourceApplicatorManufacturer","LO"],
    [0x300A,0x029C,"SourceApplicatorWallNominalThickness","DS"],
    [0x300A,0x029E,"SourceApplicatorWallNominalTransmission","DS"],
    [0x300A,0x02A0,"SourceApplicatorStepSize","DS"],
    [0x300A,0x02A2,"TransferTubeNumber","IS"],
    [0x300A,0x02A4,"TransferTubeLength","DS"],
    [0x300A,0x02B0,"ChannelShieldSequence","SQ"],
    [0x300A,0x02B2,"ChannelShieldNumber","IS"],
    [0x300A,0x02B3,"ChannelShieldID","SH"],
    [0x300A,0x02B4,"ChannelShieldName","LO"],
    [0x300A,0x02B8,"ChannelShieldNominalThickness","DS"],
    [0x300A,0x02BA,"ChannelShieldNominalTransmission","DS"],
    [0x300A,0x02C8,"FinalCumulativeTimeWeight","DS"],
    [0x300A,0x02D0,"BrachyControlPointSequence","SQ"],
    [0x300A,0x02D2,"ControlPointRelativePosition","DS"],
    [0x300A,0x02D4,"ControlPoint3DPosition","DS"],
    [0x300A,0x02D6,"CumulativeTimeWeight","DS"],
    [0x300A,0x02E0,"CompensatorDivergence","CS"],
    [0x300A,0x02E1,"CompensatorMountingPosition","CS"],
    [0x300A,0x02E2,"SourceToCompensatorDistance","DS"],
    [0x300A,0x02E3,"TotalCompensatorTrayWaterEquivalentThickness","FL"],
    [0x300A,0x02E4,"IsocenterToCompensatorTrayDistance","FL"],
    [0x300A,0x02E5,"CompensatorColumnOffset","FL"],
    [0x300A,0x02E6,"IsocenterToCompensatorDistances","FL"],
    [0x300A,0x02E7,"CompensatorRelativeStoppingPowerRatio","FL"],
    [0x300A,0x02E8,"CompensatorMillingToolDiameter","FL"],
    [0x300A,0x02EA,"IonRangeCompensatorSequence","SQ"],
    [0x300A,0x02EB,"CompensatorDescription","LT"],
    [0x300A,0x0302,"RadiationMassNumber","IS"],
    [0x300A,0x0304,"RadiationAtomicNumber","IS"],
    [0x300A,0x0306,"RadiationChargeState","SS"],
    [0x300A,0x0308,"ScanMode","CS"],
    [0x300A,0x030A,"VirtualSourceAxisDistances","FL"],
    [0x300A,0x030C,"SnoutSequence","SQ"],
    [0x300A,0x030D,"SnoutPosition","FL"],
    [0x300A,0x030F,"SnoutID","SH"],
    [0x300A,0x0312,"NumberOfRangeShifters","IS"],
    [0x300A,0x0314,"RangeShifterSequence","SQ"],
    [0x300A,0x0316,"RangeShifterNumber","IS"],
    [0x300A,0x0318,"RangeShifterID","SH"],
    [0x300A,0x0320,"RangeShifterType","CS"],
    [0x300A,0x0322,"RangeShifterDescription","LO"],
    [0x300A,0x0330,"NumberOfLateralSpreadingDevices","IS"],
    [0x300A,0x0332,"LateralSpreadingDeviceSequence","SQ"],
    [0x300A,0x0334,"LateralSpreadingDeviceNumber","IS"],
    [0x300A,0x0336,"LateralSpreadingDeviceID","SH"],
    [0x300A,0x0338,"LateralSpreadingDeviceType","CS"],
    [0x300A,0x033A,"LateralSpreadingDeviceDescription","LO"],
    [0x300A,0x033C,"LateralSpreadingDeviceWaterEquivalentThickness","FL"],
    [0x300A,0x0340,"NumberOfRangeModulators","IS"],
    [0x300A,0x0342,"RangeModulatorSequence","SQ"],
    [0x300A,0x0344,"RangeModulatorNumber","IS"],
    [0x300A,0x0346,"RangeModulatorID","SH"],
    [0x300A,0x0348,"RangeModulatorType","CS"],
    [0x300A,0x034A,"RangeModulatorDescription","LO"],
    [0x300A,0x034C,"BeamCurrentModulationID","SH"],
    [0x300A,0x0350,"PatientSupportType","CS"],
    [0x300A,0x0352,"PatientSupportID","SH"],
    [0x300A,0x0354,"PatientSupportAccessoryCode","LO"],
    [0x300A,0x0356,"FixationLightAzimuthalAngle","FL"],
    [0x300A,0x0358,"FixationLightPolarAngle","FL"],
    [0x300A,0x035A,"MetersetRate","FL"],
    [0x300A,0x0360,"RangeShifterSettingsSequence","SQ"],
    [0x300A,0x0362,"RangeShifterSetting","LO"],
    [0x300A,0x0364,"IsocenterToRangeShifterDistance","FL"],
    [0x300A,0x0366,"RangeShifterWaterEquivalentThickness","FL"],
    [0x300A,0x0370,"LateralSpreadingDeviceSettingsSequence","SQ"],
    [0x300A,0x0372,"LateralSpreadingDeviceSetting","LO"],
    [0x300A,0x0374,"IsocenterToLateralSpreadingDeviceDistance","FL"],
    [0x300A,0x0380,"RangeModulatorSettingsSequence","SQ"],
    [0x300A,0x0382,"RangeModulatorGatingStartValue","FL"],
    [0x300A,0x0384,"RangeModulatorGatingStopValue","FL"],
    [0x300A,0x0386,"RangeModulatorGatingStartWaterEquivalentThickness","FL"],
    [0x300A,0x0388,"RangeModulatorGatingStopWaterEquivalentThickness","FL"],
    [0x300A,0x038A,"IsocenterToRangeModulatorDistance","FL"],
    [0x300A,0x0390,"ScanSpotTuneID","SH"],
    [0x300A,0x0392,"NumberOfScanSpotPositions","IS"],
    [0x300A,0x0394,"ScanSpotPositionMap","FL"],
    [0x300A,0x0396,"ScanSpotMetersetWeights","FL"],
    [0x300A,0x0398,"ScanningSpotSize","FL"],
    [0x300A,0x039A,"NumberOfPaintings","IS"],
    [0x300A,0x03A0,"IonToleranceTableSequence","SQ"],
    [0x300A,0x03A2,"IonBeamSequence","SQ"],
    [0x300A,0x03A4,"IonBeamLimitingDeviceSequence","SQ"],
    [0x300A,0x03A6,"IonBlockSequence","SQ"],
    [0x300A,0x03A8,"IonControlPointSequence","SQ"],
    [0x300A,0x03AA,"IonWedgeSequence","SQ"],
    [0x300A,0x03AC,"IonWedgePositionSequence","SQ"],
    [0x300A,0x0401,"ReferencedSetupImageSequence","SQ"],
    [0x300A,0x0402,"SetupImageComment","ST"],
    [0x300A,0x0410,"MotionSynchronizationSequence","SQ"],
    [0x300A,0x0412,"ControlPointOrientation","FL"],
    [0x300A,0x0420,"GeneralAccessorySequence","SQ"],
    [0x300A,0x0421,"GeneralAccessoryID","SH"],
    [0x300A,0x0422,"GeneralAccessoryDescription","ST"],
    [0x300A,0x0423,"GeneralAccessoryType","CS"],
    [0x300A,0x0424,"GeneralAccessoryNumber","IS"],
    [0x300A,0x0431,"ApplicatorGeometrySequence","SQ"],
    [0x300A,0x0432,"ApplicatorApertureShape","CS"],
    [0x300A,0x0433,"ApplicatorOpening","FL"],
    [0x300A,0x0434,"ApplicatorOpeningX","FL"],
    [0x300A,0x0435,"ApplicatorOpeningY","FL"],
    [0x300A,0x0436,"SourceToApplicatorMountingPositionDistance","FL"],
    [0x300C,0x0002,"ReferencedRTPlanSequence","SQ"],
    [0x300C,0x0004,"ReferencedBeamSequence","SQ"],
    [0x300C,0x0006,"ReferencedBeamNumber","IS"],
    [0x300C,0x0007,"ReferencedReferenceImageNumber","IS"],
    [0x300C,0x0008,"StartCumulativeMetersetWeight","DS"],
    [0x300C,0x0009,"EndCumulativeMetersetWeight","DS"],
    [0x300C,0x000A,"ReferencedBrachyApplicationSetupSequence","SQ"],
    [0x300C,0x000C,"ReferencedBrachyApplicationSetupNumber","IS"],
    [0x300C,0x000E,"ReferencedSourceNumber","IS"],
    [0x300C,0x0020,"ReferencedFractionGroupSequence","SQ"],
    [0x300C,0x0022,"ReferencedFractionGroupNumber","IS"],
    [0x300C,0x0040,"ReferencedVerificationImageSequence","SQ"],
    [0x300C,0x0042,"ReferencedReferenceImageSequence","SQ"],
    [0x300C,0x0050,"ReferencedDoseReferenceSequence","SQ"],
    [0x300C,0x0051,"ReferencedDoseReferenceNumber","IS"],
    [0x300C,0x0055,"BrachyReferencedDoseReferenceSequence","SQ"],
    [0x300C,0x0060,"ReferencedStructureSetSequence","SQ"],
    [0x300C,0x006A,"ReferencedPatientSetupNumber","IS"],
    [0x300C,0x0080,"ReferencedDoseSequence","SQ"],
    [0x300C,0x00A0,"ReferencedToleranceTableNumber","IS"],
    [0x300C,0x00B0,"ReferencedBolusSequence","SQ"],
    [0x300C,0x00C0,"ReferencedWedgeNumber","IS"],
    [0x300C,0x00D0,"ReferencedCompensatorNumber","IS"],
    [0x300C,0x00E0,"ReferencedBlockNumber","IS"],
    [0x300C,0x00F0,"ReferencedControlPointIndex","IS"],
    [0x300C,0x00F2,"ReferencedControlPointSequence","SQ"],
    [0x300C,0x00F4,"ReferencedStartControlPointIndex","IS"],
    [0x300C,0x00F6,"ReferencedStopControlPointIndex","IS"],
    [0x300C,0x0100,"ReferencedRangeShifterNumber","IS"],
    [0x300C,0x0102,"ReferencedLateralSpreadingDeviceNumber","IS"],
    [0x300C,0x0104,"ReferencedRangeModulatorNumber","IS"],
    [0x300E,0x0002,"ApprovalStatus","CS"],
    [0x300E,0x0004,"ReviewDate","DA"],
    [0x300E,0x0005,"ReviewTime","TM"],
    [0x300E,0x0008,"ReviewerName","PN"],
    [0x4000,0x0010,"Arbitrary","LT"],
    [0x4000,0x4000,"TextComments","LT"],
    [0x4008,0x0040,"ResultsID","SH"],
    [0x4008,0x0042,"ResultsIDIssuer","LO"],
    [0x4008,0x0050,"ReferencedInterpretationSequence","SQ"],
    [0x4008,0x00FF,"ReportProductionStatusTrial","CS"],
    [0x4008,0x0100,"InterpretationRecordedDate","DA"],
    [0x4008,0x0101,"InterpretationRecordedTime","TM"],
    [0x4008,0x0102,"InterpretationRecorder","PN"],
    [0x4008,0x0103,"ReferenceToRecordedSound","LO"],
    [0x4008,0x0108,"InterpretationTranscriptionDate","DA"],
    [0x4008,0x0109,"InterpretationTranscriptionTime","TM"],
    [0x4008,0x010A,"InterpretationTranscriber","PN"],
    [0x4008,0x010B,"InterpretationText","ST"],
    [0x4008,0x010C,"InterpretationAuthor","PN"],
    [0x4008,0x0111,"InterpretationApproverSequence","SQ"],
    [0x4008,0x0112,"InterpretationApprovalDate","DA"],
    [0x4008,0x0113,"InterpretationApprovalTime","TM"],
    [0x4008,0x0114,"PhysicianApprovingInterpretation","PN"],
    [0x4008,0x0115,"InterpretationDiagnosisDescription","LT"],
    [0x4008,0x0117,"InterpretationDiagnosisCodeSequence","SQ"],
    [0x4008,0x0118,"ResultsDistributionListSequence","SQ"],
    [0x4008,0x0119,"DistributionName","PN"],
    [0x4008,0x011A,"DistributionAddress","LO"],
    [0x4008,0x0200,"InterpretationID","SH"],
    [0x4008,0x0202,"InterpretationIDIssuer","LO"],
    [0x4008,0x0210,"InterpretationTypeID","CS"],
    [0x4008,0x0212,"InterpretationStatusID","CS"],
    [0x4008,0x0300,"Impressions","ST"],
    [0x4008,0x4000,"ResultsComments","ST"],
    [0x4010,0x0001,"LowEnergyDetectors","CS"],
    [0x4010,0x0002,"HighEnergyDetectors","CS"],
    [0x4010,0x0004,"DetectorGeometrySequence","SQ"],
    [0x4010,0x1001,"ThreatROIVoxelSequence","SQ"],
    [0x4010,0x1004,"ThreatROIBase","FL"],
    [0x4010,0x1005,"ThreatROIExtents","FL"],
    [0x4010,0x1006,"ThreatROIBitmap","OB"],
    [0x4010,0x1007,"RouteSegmentID","SH"],
    [0x4010,0x1008,"GantryType","CS"],
    [0x4010,0x1009,"OOIOwnerType","CS"],
    [0x4010,0x100A,"RouteSegmentSequence","SQ"],
    [0x4010,0x1010,"PotentialThreatObjectID","US"],
    [0x4010,0x1011,"ThreatSequence","SQ"],
    [0x4010,0x1012,"ThreatCategory","CS"],
    [0x4010,0x1013,"ThreatCategoryDescription","LT"],
    [0x4010,0x1014,"ATDAbilityAssessment","CS"],
    [0x4010,0x1015,"ATDAssessmentFlag","CS"],
    [0x4010,0x1016,"ATDAssessmentProbability","FL"],
    [0x4010,0x1017,"Mass","FL"],
    [0x4010,0x1018,"Density","FL"],
    [0x4010,0x1019,"ZEffective","FL"],
    [0x4010,0x101A,"BoardingPassID","SH"],
    [0x4010,0x101B,"CenterOfMass","FL"],
    [0x4010,0x101C,"CenterOfPTO","FL"],
    [0x4010,0x101D,"BoundingPolygon","FL"],
    [0x4010,0x101E,"RouteSegmentStartLocationID","SH"],
    [0x4010,0x101F,"RouteSegmentEndLocationID","SH"],
    [0x4010,0x1020,"RouteSegmentLocationIDType","CS"],
    [0x4010,0x1021,"AbortReason","CS"],
    [0x4010,0x1023,"VolumeOfPTO","FL"],
    [0x4010,0x1024,"AbortFlag","CS"],
    [0x4010,0x1025,"RouteSegmentStartTime","DT"],
    [0x4010,0x1026,"RouteSegmentEndTime","DT"],
    [0x4010,0x1027,"TDRType","CS"],
    [0x4010,0x1028,"InternationalRouteSegment","CS"],
    [0x4010,0x1029,"ThreatDetectionAlgorithmandVersion","LO"],
    [0x4010,0x102A,"AssignedLocation","SH"],
    [0x4010,0x102B,"AlarmDecisionTime","DT"],
    [0x4010,0x1031,"AlarmDecision","CS"],
    [0x4010,0x1033,"NumberOfTotalObjects","US"],
    [0x4010,0x1034,"NumberOfAlarmObjects","US"],
    [0x4010,0x1037,"PTORepresentationSequence","SQ"],
    [0x4010,0x1038,"ATDAssessmentSequence","SQ"],
    [0x4010,0x1039,"TIPType","CS"],
    [0x4010,0x103A,"DICOSVersion","CS"],
    [0x4010,0x1041,"OOIOwnerCreationTime","DT"],
    [0x4010,0x1042,"OOIType","CS"],
    [0x4010,0x1043,"OOISize","FL"],
    [0x4010,0x1044,"AcquisitionStatus","CS"],
    [0x4010,0x1045,"BasisMaterialsCodeSequence","SQ"],
    [0x4010,0x1046,"PhantomType","CS"],
    [0x4010,0x1047,"OOIOwnerSequence","SQ"],
    [0x4010,0x1048,"ScanType","CS"],
    [0x4010,0x1051,"ItineraryID","LO"],
    [0x4010,0x1052,"ItineraryIDType","SH"],
    [0x4010,0x1053,"ItineraryIDAssigningAuthority","LO"],
    [0x4010,0x1054,"RouteID","SH"],
    [0x4010,0x1055,"RouteIDAssigningAuthority","SH"],
    [0x4010,0x1056,"InboundArrivalType","CS"],
    [0x4010,0x1058,"CarrierID","SH"],
    [0x4010,0x1059,"CarrierIDAssigningAuthority","CS"],
    [0x4010,0x1060,"SourceOrientation","FL"],
    [0x4010,0x1061,"SourcePosition","FL"],
    [0x4010,0x1062,"BeltHeight","FL"],
    [0x4010,0x1064,"AlgorithmRoutingCodeSequence","SQ"],
    [0x4010,0x1067,"TransportClassification","CS"],
    [0x4010,0x1068,"OOITypeDescriptor","LT"],
    [0x4010,0x1069,"TotalProcessingTime","FL"],
    [0x4010,0x106C,"DetectorCalibrationData","OB"]
];


/*** Static Methods ***/

daikon.Dictionary.getVR = function (group, element) {
    var vr = null, startIndex, ctr, num;

    startIndex = daikon.Dictionary.GROUP_INDICES[group];
    if (!startIndex) {
        startIndex = daikon.Dictionary.GROUP_INDICES[daikon.Dictionary.GROUP_INDICES.length - 1];
    }

    num = daikon.Dictionary.dict.length;

    for (ctr = startIndex; ctr < num; ctr += 1) {
        if ((daikon.Dictionary.dict[ctr][0] === group) && (daikon.Dictionary.dict[ctr][1] === element)) {
            vr = daikon.Dictionary.dict[ctr][3];
            break;
        } else if (daikon.Dictionary.dict[ctr][0] > group) {
            break;
        }
    }

    if (vr === null) {
        num = daikon.Dictionary.dictPrivate.length;
        for (ctr = 0; ctr < num; ctr += 1) {
            if ((daikon.Dictionary.dictPrivate[ctr][0] === group) &&
                (daikon.Dictionary.dictPrivate[ctr][1] === element)) {
                vr = daikon.Dictionary.dictPrivate[ctr][3];
                break;
            }
        }

        if (vr === null) {
            vr = 'OB';
        }
    }

    return vr;
};



daikon.Dictionary.getDescription = function (group, element) {
    var des = null, startIndex, ctr, num;

    startIndex = daikon.Dictionary.GROUP_INDICES[group];
    if (startIndex === undefined) {
        startIndex = daikon.Dictionary.GROUP_INDICES[daikon.Dictionary.GROUP_INDICES.length - 1];
    }

    num = daikon.Dictionary.dict.length;

    for (ctr = startIndex; ctr < num; ctr += 1) {
        if ((daikon.Dictionary.dict[ctr][0] === group) && (daikon.Dictionary.dict[ctr][1] === element)) {
            des = daikon.Dictionary.dict[ctr][2];
            break;
        } else if (daikon.Dictionary.dict[ctr][0] > group) {
            break;
        }
    }

    if (des === null) {
        num = daikon.Dictionary.dictPrivate.length;
        for (ctr = 0; ctr < num; ctr += 1) {
            if ((daikon.Dictionary.dictPrivate[ctr][0] === group) &&
                (daikon.Dictionary.dictPrivate[ctr][1] === element)) {
                des = daikon.Dictionary.dictPrivate[ctr][2];
                break;
            }
        }

        if (des === null) {
            des = 'PrivateData';
        }
    }

    return des;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Dictionary;
}

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Tag = daikon.Tag || ((typeof require !== 'undefined') ? require('./tag.js') : null);
daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);


/*** Constructor ***/
daikon.Image = daikon.Image || function () {
    this.tags = {};
    this.littleEndian = false;
    this.index = -1;
};


/*** Static Pseudo-constants ***/

daikon.Image.SLICE_DIRECTION_UNKNOWN = -1;
daikon.Image.SLICE_DIRECTION_AXIAL = 2;
daikon.Image.SLICE_DIRECTION_CORONAL = 1;
daikon.Image.SLICE_DIRECTION_SAGITTAL = 0;
daikon.Image.SLICE_DIRECTION_OBLIQUE = 3;
daikon.Image.OBLIQUITY_THRESHOLD_COSINE_VALUE = 0.8;

daikon.Image.BYTE_TYPE_UNKNOWN = 0;
daikon.Image.BYTE_TYPE_BINARY = 1;
daikon.Image.BYTE_TYPE_INTEGER = 2;
daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED = 3;
daikon.Image.BYTE_TYPE_FLOAT = 4;
daikon.Image.BYTE_TYPE_COMPLEX = 5;
daikon.Image.BYTE_TYPE_RGB = 6;


/*** Static Methods ***/

daikon.Image.getSingleValueSafely = function (tag, index) {
    if (tag && tag.value) {
        return tag.value[index];
    }

    return null;
};



daikon.Image.getValueSafely = function (tag) {
    if (tag) {
        return tag.value;
    }

    return null;
};



// originally from: http://public.kitware.com/pipermail/insight-users/2005-March/012246.html
daikon.Image.getMajorAxisFromPatientRelativeDirectionCosine = function(x, y, z) {
    var axis, orientationX, orientationY, orientationZ, absX, absY, absZ;

    orientationX = (x < 0) ? "R" : "L";
    orientationY = (y < 0) ? "A" : "P";
    orientationZ = (z < 0) ? "F" : "H";

    absX = Math.abs(x);
    absY = Math.abs(y);
    absZ = Math.abs(z);

    // The tests here really don't need to check the other dimensions,
    // just the threshold, since the sum of the squares should be == 1.0
    // but just in case ...

    if ((absX > daikon.Image.OBLIQUITY_THRESHOLD_COSINE_VALUE) && (absX > absY) && (absX > absZ)) {
        axis = orientationX;
    } else if ((absY > daikon.Image.OBLIQUITY_THRESHOLD_COSINE_VALUE) && (absY > absX) && (absY > absZ)) {
        axis = orientationY;
    } else if ((absZ > daikon.Image.OBLIQUITY_THRESHOLD_COSINE_VALUE) && (absZ > absX) && (absZ > absY)) {
        axis = orientationZ;
    } else {
        axis = null;
    }

    return axis;
};


/*** Prototype Methods ***/

daikon.Image.prototype.getCols = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_COLS[0], daikon.Tag.TAG_COLS[1]), 0);
};



daikon.Image.prototype.getRows = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_ROWS[0], daikon.Tag.TAG_ROWS[1]), 0);
};



daikon.Image.prototype.getSeriesDescription = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_DESCRIPTION[0], daikon.Tag.TAG_SERIES_DESCRIPTION[1]), 0);
};



daikon.Image.prototype.getSeriesInstanceUID = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_INSTANCE_UID[0], daikon.Tag.TAG_SERIES_INSTANCE_UID[1]), 0);
};



daikon.Image.prototype.getSeriesNumber = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_NUMBER[0], daikon.Tag.TAG_SERIES_NUMBER[1]), 0);
};



daikon.Image.prototype.getEchoNumber = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_ECHO_NUMBER[0], daikon.Tag.TAG_ECHO_NUMBER[1]), 0);
};



daikon.Image.prototype.getImagePosition = function () {
    return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_POSITION[0], daikon.Tag.TAG_IMAGE_POSITION[1]));
};



daikon.Image.prototype.getImagePositionSliceDir = function (sliceDir) {
    var imagePos = daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_POSITION[0], daikon.Tag.TAG_IMAGE_POSITION[1]));
    if (imagePos) {
        if (sliceDir >= 0) {
            return imagePos[sliceDir];
        }
    }

    return 0;
};



daikon.Image.prototype.getSliceLocation = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SLICE_LOCATION[0], daikon.Tag.TAG_SLICE_LOCATION[1]), 0);
};



daikon.Image.prototype.getSliceLocationVector = function () {
    return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_SLICE_LOCATION_VECTOR[0], daikon.Tag.TAG_SLICE_LOCATION_VECTOR[1]));
};



daikon.Image.prototype.getImageNumber = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_NUM[0], daikon.Tag.TAG_IMAGE_NUM[1]), 0);
};



daikon.Image.prototype.getTemporalPosition = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_TEMPORAL_POSITION[0], daikon.Tag.TAG_TEMPORAL_POSITION[1]), 0);
};



daikon.Image.prototype.getTemporalNumber = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_NUMBER_TEMPORAL_POSITIONS[0], daikon.Tag.TAG_NUMBER_TEMPORAL_POSITIONS[1]), 0);
};



daikon.Image.prototype.getSliceGap = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SLICE_GAP[0], daikon.Tag.TAG_SLICE_GAP[1]), 0);
};



daikon.Image.prototype.getSliceThickness = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SLICE_THICKNESS[0], daikon.Tag.TAG_SLICE_THICKNESS[1]), 0);
};



daikon.Image.prototype.getImageMax = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_MAX[0], daikon.Tag.TAG_IMAGE_MAX[1]), 0);
};



daikon.Image.prototype.getImageMin = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_MIN[0], daikon.Tag.TAG_IMAGE_MIN[1]), 0);
};



daikon.Image.prototype.getDataScaleSlope = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_DATA_SCALE_SLOPE[0], daikon.Tag.TAG_DATA_SCALE_SLOPE[1]), 0);
};



daikon.Image.prototype.getDataScaleIntercept = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_DATA_SCALE_INTERCEPT[0], daikon.Tag.TAG_DATA_SCALE_INTERCEPT[1]), 0);
};



daikon.Image.prototype.getDataScaleElscint = function () {
    var scale = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_DATA_SCALE_ELSCINT[0], daikon.Tag.TAG_DATA_SCALE_ELSCINT[1]), 0);

    if (!scale) {
        scale = 1;
    }

    var bandwidth = this.getPixelBandwidth();
    scale = Math.sqrt(bandwidth) / (10 * scale);

    if (scale <= 0) {
        scale = 1;
    }

    return scale;
};



daikon.Image.prototype.getWindowWidth = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_WINDOW_WIDTH[0], daikon.Tag.TAG_WINDOW_WIDTH[1]), 0);
};



daikon.Image.prototype.getWindowCenter = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_WINDOW_CENTER[0], daikon.Tag.TAG_WINDOW_CENTER[1]), 0);
};



daikon.Image.prototype.getPixelBandwidth = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PIXEL_BANDWIDTH[0], daikon.Tag.TAG_PIXEL_BANDWIDTH[1]), 0);
};



daikon.Image.prototype.getSeriesId = function () {
    var des = this.getSeriesDescription();
    var uid = this.getSeriesInstanceUID();
    var num = this.getSeriesNumber();
    var echo = this.getEchoNumber();
    var orientation = this.getOrientation();

    var id = "";

    if (des !== null) {
        id += (" " + des);
    }

    if (uid !== null) {
        id += (" " + uid);
    }

    if (num !== null) {
        id += (" " + num);
    }

    if (echo !== null) {
        id += (" " + echo);
    }

    if (orientation !== null) {
        id += (" " + orientation);
    }

    return id;
};



daikon.Image.prototype.getPixelSpacing = function () {
    return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_PIXEL_SPACING[0], daikon.Tag.TAG_PIXEL_SPACING[1]));
};



daikon.Image.prototype.getImageType = function () {
    return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_TYPE[0], daikon.Tag.TAG_IMAGE_TYPE[1]));
};



daikon.Image.prototype.getBitsStored = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_BITS_STORED[0], daikon.Tag.TAG_BITS_STORED[1]), 0);
};



daikon.Image.prototype.getBitsAllocated = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_BITS_ALLOCATED[0], daikon.Tag.TAG_BITS_ALLOCATED[1]), 0);
};



daikon.Image.prototype.getFrameTime = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_FRAME_TIME[0], daikon.Tag.TAG_FRAME_TIME[1]), 0);
};



daikon.Image.prototype.getAcquisitionMatrix = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_ACQUISITION_MATRIX[0], daikon.Tag.TAG_ACQUISITION_MATRIX[1]), 0);
};



daikon.Image.prototype.getTR = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_TR, daikon.Tag.TAG_TR[1]), 0);
};



daikon.Image.prototype.putTag = function (tag) {
    this.tags[tag.id] = tag;
};



daikon.Image.prototype.getTag = function (group, element) {
    return this.tags[daikon.Tag.createId(group, element)];
};



daikon.Image.prototype.getPixelData = function () {
    return this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])];
};



daikon.Image.prototype.hasPixelData = function () {
    return (this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])] !== undefined);
};



daikon.Image.prototype.clearPixelData = function () {
    this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = null;
};



daikon.Image.prototype.getOrientation = function () {
    var orientation = null,
        dirCos = daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_ORIENTATION[0], daikon.Tag.TAG_IMAGE_ORIENTATION[1])),
        ctr,
        spacing,
        rowSpacing,
        swapZ,
        bigRow = 0, bigCol = 0,
        biggest = 0, orient = '';

    if (!dirCos || (dirCos.length !== 6)) {
        return null;
    }

    spacing = this.getPixelSpacing();

    if (!spacing) {
        return null;
    }

    rowSpacing = spacing[0];
    swapZ = true;

    for (ctr = 0; ctr < 3; ctr += 1) {
        if (Math.abs(dirCos[ctr]) > biggest) {
            biggest = Math.abs(dirCos[ctr]);
            bigRow = ctr;
        }
    }

    biggest = 0;
    for (; ctr < 6; ctr += 1) {
        if (Math.abs(dirCos[ctr]) > biggest) {
            biggest = Math.abs(dirCos[ctr]);
            bigCol = ctr;
        }
    }

    switch (bigRow) {
        case 0:
            orient += ('X');
            if (bigCol === 4) {
                orient += ("YZ");
            } else {
                orient += ("ZY");
            }
            break;
        case 1:
            orient += ('Y');
            if (bigCol === 3) {
                orient += ("XZ");
            } else {
                orient += ("ZX");
            }
            break;
        case 2:
            orient += ('Z');
            if (bigCol === 3) {
                orient += ("XY");
            } else {
                orient += ("YX");
            }
            break;
        default:
            break;
    }

    switch (bigRow) {
        case 0:
            if (dirCos[bigRow] > 0.0) {
                orient += ('-');
            } else {
                orient += ('+');
            }
            if (bigCol === 4) {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('-');
                } else {
                    orient += ('+');
                }
            } else {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('+');
                } else {
                    orient += ('-');
                }
            }
            break;
        case 1:
            if (dirCos[bigRow] > 0.0) {
                orient += ('-');
            } else {
                orient += ('+');
            }
            if (bigCol === 3) {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('-');
                } else {
                    orient += ('+');
                }
            } else {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('+');
                } else {
                    orient += ('-');
                }
            }
            break;
        case 2:
            if (dirCos[bigRow] > 0.0) {
                orient += ('+');
            } else {
                orient += ('-');
            }
            //Has to be X or Y so opposite senses
            if (dirCos[bigCol] > 0.0) {
                orient += ('-');
            } else {
                orient += ('+');
            }
            break;
        default:
            break;
    }

    if (rowSpacing === 0.0) {
        orient += ('+');
        orientation = orient;
    } else {
        if (swapZ) {
            switch (orient.charAt(2)) {
                case 'X':
                    if (rowSpacing > 0.0) {
                        orient += ('-');
                    } else {
                        orient += ('+');
                    }
                    break;
                case 'Y':
                case 'Z':
                    if (rowSpacing > 0.0) {
                        orient += ('+');
                    } else {
                        orient += ('-');
                    }
                    break;
                default:
                    break;
            }
        } else {
            switch (orient.charAt(2)) {
                case 'X':
                    if (rowSpacing > 0.0) {
                        orient += ('+');
                    } else {
                        orient += ('-');
                    }
                    break;
                case 'Y':
                case 'Z':
                    if (rowSpacing > 0.0) {
                        orient += ('-');
                    } else {
                        orient += ('+');
                    }
                    break;
                default:
                    break;
            }
        }

        orientation = orient;
    }

    return orientation;
};



daikon.Image.prototype.isMosaic = function () {
    var imageType, labeledAsMosaic = false, canReadAsMosaic, ctr, matSize;

    imageType = this.getImageType();

    if (imageType !== null) {
        for (ctr = 0; ctr < imageType.length; ctr += 1) {
            if (imageType[ctr].toUpperCase().indexOf("MOSAIC") !== -1) {
                labeledAsMosaic = true;
                break;
            }
        }
    }

    matSize = this.getAcquisitionMatrix();
    canReadAsMosaic = (matSize > 0) && ((matSize < this.getRows()) || (matSize < this.getCols()));
    return labeledAsMosaic && canReadAsMosaic;
};


/*
if (isMosaic) {
    dcm.setMosaicCols(tempDicom[chosenFileIndex].getCols() / matSize[1]);
    dcm.setMosaicRows(tempDicom[chosenFileIndex].getRows() / matSize[0]);
    dcm.setMosaicWidth(tempDicom[chosenFileIndex].getCols());
    dcm.setMosaicHeight(tempDicom[chosenFileIndex].getRows());
}
*/



daikon.Image.prototype.getMosaicCols = function() {
    return this.getCols() / this.getAcquisitionMatrix();
};



daikon.Image.prototype.getMosaicRows = function() {
    return this.getRows() / this.getAcquisitionMatrix();
};



daikon.Image.prototype.isElscint = function() {
    var dataScale = this.getDataScaleElscint();
    return ((dataScale !== null) && (dataScale !== 0));
};



daikon.Image.prototype.isCompressed = function() {
    var transferSyntax = this.getTransferSyntax();
    if (transferSyntax) {
        if (transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG) !== -1) {
            return true;
        } else if (transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_RLE) !== -1) {
            return true;
        }
    }

    return false;
};



daikon.Image.prototype.getNumberOfFrames = function () {
    var value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_NUMBER_OF_FRAMES[0], daikon.Tag.TAG_NUMBER_OF_FRAMES[1]), 0);

    if (value !== null) {
        return value;
    }

    return 1;
};



daikon.Image.prototype.getNumberOfImplicitFrames = function () {
    var pixelData, length, size;

    pixelData = this.getPixelData();
    length = pixelData.offsetEnd - pixelData.offsetValue;
    size = this.getCols() * this.getRows() * (parseInt(this.getBitsAllocated() / 8));

    return parseInt(length / size);
};



daikon.Image.prototype.getPixelRepresentation = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PIXEL_REPRESENTATION[0], daikon.Tag.TAG_PIXEL_REPRESENTATION[1]), 0);
};



daikon.Image.prototype.getPhotometricInterpretation = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION[0], daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION[1]), 0);
};



daikon.Image.prototype.getPatientName = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PATIENT_NAME[0], daikon.Tag.TAG_PATIENT_NAME[1]), 0);
};



daikon.Image.prototype.getPatientID = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PATIENT_ID[0], daikon.Tag.TAG_PATIENT_ID[1]), 0);
};



daikon.Image.prototype.getStudyTime = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_STUDY_TIME[0], daikon.Tag.TAG_STUDY_TIME[1]), 0);
};



daikon.Image.prototype.getTransferSyntax = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_TRANSFER_SYNTAX[0], daikon.Tag.TAG_TRANSFER_SYNTAX[1]), 0);
};



daikon.Image.prototype.getStudyDate = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_STUDY_DATE[0], daikon.Tag.TAG_STUDY_DATE[1]), 0);
};



daikon.Image.prototype.getImageDescription = function () {
    var value, string = "";

    value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_STUDY_DES[0], daikon.Tag.TAG_STUDY_DES[1]), 0);
    if (value !== null) {
        string += (" " + value);
    }

    value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_DESCRIPTION[0], daikon.Tag.TAG_SERIES_DESCRIPTION[1]), 0);
    if (value !== null) {
        string += (" " + value);
    }

    value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_COMMENTS[0], daikon.Tag.TAG_IMAGE_COMMENTS[1]), 0);
    if (value !== null) {
        string += (" " + value);
    }

    return string.trim();
};



daikon.Image.prototype.getDataType = function () {
    var interp, dataType;

    dataType = this.getPixelRepresentation();

    if (dataType === null) {
        return daikon.Image.BYTE_TYPE_UNKNOWN;
    }

    interp = this.getPhotometricInterpretation();
    if (interp !== null) {
        if (interp.trim() === "RGB") {
            return daikon.Image.BYTE_TYPE_RGB;
        }
    }

    if (dataType === 0) {
        return daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED;
    } else if (dataType === 1) {
        return daikon.Image.BYTE_TYPE_INTEGER;
    } else {
        return daikon.Image.BYTE_TYPE_UNKNOWN;
    }
};



// originally from: http://public.kitware.com/pipermail/insight-users/2005-March/012246.html
daikon.Image.prototype.getAcquiredSliceDirection = function () {
    var dirCos, rowAxis, colAxis, label;

    dirCos = daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_ORIENTATION[0], daikon.Tag.TAG_IMAGE_ORIENTATION[1]));

    if (!dirCos || (dirCos.length !== 6)) {
        return daikon.Image.SLICE_DIRECTION_UNKNOWN;
    }

    rowAxis = daikon.Image.getMajorAxisFromPatientRelativeDirectionCosine(dirCos[0], dirCos[1], dirCos[2]);
    colAxis = daikon.Image.getMajorAxisFromPatientRelativeDirectionCosine(dirCos[3], dirCos[4], dirCos[5]);

    if ((rowAxis !== null) && (colAxis !== null)) {
        if (((rowAxis === "R") || (rowAxis === "L")) && ((colAxis === "A") || (colAxis === "P"))) {
            label = daikon.Image.SLICE_DIRECTION_AXIAL;
        } else if (((colAxis === "R") || (colAxis === "L")) && ((rowAxis === "A") || (rowAxis === "P"))) {
            label = daikon.Image.SLICE_DIRECTION_AXIAL;
        } else if (((rowAxis === "R") || (rowAxis === "L")) && ((colAxis === "H") || (colAxis === "F"))) {
            label = daikon.Image.SLICE_DIRECTION_CORONAL;
        } else if (((colAxis === "R") || (colAxis === "L")) && ((rowAxis === "H") || (rowAxis === "F"))) {
            label = daikon.Image.SLICE_DIRECTION_CORONAL;
        } else if (((rowAxis === "A") || (rowAxis === "P")) && ((colAxis === "H") || (colAxis === "F"))) {
            label = daikon.Image.SLICE_DIRECTION_SAGITTAL;
        } else if (((colAxis === "A") || (colAxis === "P")) && ((rowAxis === "H") || (rowAxis === "F"))) {
            label = daikon.Image.SLICE_DIRECTION_SAGITTAL;
        }
    } else {
        label = daikon.Image.SLICE_DIRECTION_OBLIQUE;
    }

    return label;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Image;
}

/*jslint browser: true, node: true */
/*global require */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.OrderedMap = daikon.OrderedMap || ((typeof require !== 'undefined') ? require('./orderedmap.js') : null);


/*** Constructor ***/
daikon.OrderedMapIterator = daikon.OrderedMapIterator || function (orderedMap) {
    this.orderedMap = orderedMap;
    this.index = 0;
};


/*** Prototype Methods ***/

daikon.OrderedMapIterator.prototype.hasNext = function() {
    return (this.index < this.orderedMap.orderedKeys.length);
};



daikon.OrderedMapIterator.prototype.next = function() {
    var item = this.orderedMap.get(this.orderedMap.orderedKeys[this.index]);
    this.index += 1;
    return item;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.OrderedMapIterator;
}

/*jslint browser: true, node: true */
/*global require */

"use strict";

// Based on: http://stackoverflow.com/questions/3549894/javascript-data-structure-for-fast-lookup-and-ordered-looping

/*** Imports ***/
var daikon = daikon || {};
daikon.OrderedMapIterator = daikon.OrderedMapIterator || ((typeof require !== 'undefined') ? require('./iterator.js') : null);


/*** Constructor ***/
daikon.OrderedMap = daikon.OrderedMap || function () {
    this.map = {};
    this.orderedKeys = [];
};



daikon.OrderedMap.prototype.put = function(key, value) {
    if (key in this.map) { // key already exists, replace value
        this.map[key] = value;
    } else { // insert new key and value
        this.orderedKeys.push(key);
        this.orderedKeys.sort(function(a, b) { return parseFloat(a) - parseFloat(b); });
        this.map[key] = value;
    }
};



daikon.OrderedMap.prototype.remove = function(key) {
    var index = this.orderedKeys.indexOf(key);
    if(index === -1) {
        throw new Error('key does not exist');
    }

    this.orderedKeys.splice(index, 1);
    delete this.map[key];
};



daikon.OrderedMap.prototype.get = function(key) {
    if (key in this.map) {
        return this.map[key];
    }

    return null;
};



daikon.OrderedMap.prototype.iterator = function() {
    return new daikon.OrderedMapIterator(this);
};



daikon.OrderedMap.prototype.getOrderedValues = function() {
    var orderedValues = [], it = this.iterator();

    while (it.hasNext()) {
        orderedValues.push(it.next());
    }

    return orderedValues;
};



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.OrderedMap;
}

/*jslint browser: true, node: true */
/*global require */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Tag = daikon.Tag || ((typeof require !== 'undefined') ? require('./tag.js') : null);
daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);
daikon.Dictionary = daikon.Dictionary || ((typeof require !== 'undefined') ? require('./dictionary.js') : null);
daikon.Image = daikon.Image || ((typeof require !== 'undefined') ? require('./image.js') : null);


/*** Constructor ***/
daikon.Parser = daikon.Parser || function () {
    this.littleEndian = true;
    this.explicit = true;
    this.metaFound = false;
    this.metaFinished = false;
    this.metaFinishedOffset = -1;
    this.error = null;
};


/*** Static Fields ***/
daikon.Parser.verbose = false;


/*** Static Pseudo-constants ***/

daikon.Parser.MAGIC_COOKIE_OFFSET = 128;
daikon.Parser.MAGIC_COOKIE = [68, 73, 67, 77];
daikon.Parser.VRS = ["AE", "AS", "AT", "CS", "DA", "DS", "DT", "FL", "FD", "IS", "LO", "LT", "OB", "OD", "OF", "OW", "PN", "SH", "SL", "SS", "ST", "TM", "UI", "UL", "UN", "US", "UT"];
daikon.Parser.DATA_VRS = ["OB", "OW", "OF", "SQ", "UT", "UN"];
daikon.Parser.RAW_DATA_VRS = ["OB", "OD", "OF", "OW", "UN"];
daikon.Parser.TRANSFER_SYNTAX_IMPLICIT_LITTLE = "1.2.840.10008.1.2";
daikon.Parser.TRANSFER_SYNTAX_EXPLICIT_LITTLE = "1.2.840.10008.1.2.1";
daikon.Parser.TRANSFER_SYNTAX_EXPLICIT_BIG = "1.2.840.10008.1.2.2";
daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG = "1.2.840.10008.1.2.4";
daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_RLE = "1.2.840.10008.1.2.5";
daikon.Parser.UNDEFINED_LENGTH = 0xFFFFFFFF;


/*** Static Methods ***/

daikon.Parser.isMagicCookieFound = function (data) {
    var offset = daikon.Parser.MAGIC_COOKIE_OFFSET, magicCookieLength = daikon.Parser.MAGIC_COOKIE.length, ctr;

    for (ctr = 0; ctr < magicCookieLength; ctr += 1) {
        if (data.getUint8(offset + ctr) !== daikon.Parser.MAGIC_COOKIE[ctr]) {
            return false;
        }
    }

    return true;
};


/*** Prototype Methods ***/

daikon.Parser.prototype.parse = function (data) {
    var image = null, offset, tag;

    try {
        image = new daikon.Image();
        offset = this.findFirstTagOffset(data);
        tag = this.getNextTag(data, offset);

        while (tag !== null) {
            if (daikon.Parser.verbose) {
                console.log(tag.toString());
            }

            image.putTag(tag);

            if (tag.isPixelData()) {
                break;
            }

            tag = this.getNextTag(data, tag.offsetEnd);
        }
    } catch (err) {
        this.error = err;
    }

    if (image !== null) {
        image.littleEndian = this.littleEndian;
    }

    return image;
};



daikon.Parser.prototype.testForValidTag = function (data) {
    var offset, tag = null;

    try {
        offset = this.findFirstTagOffset(data);
        tag = this.getNextTag(data, offset, true);
    } catch (err) {
        this.error = err;
    }

    return tag;
};



daikon.Parser.prototype.getNextTag = function (data, offset, testForTag) {
    var group = 0, element, value = null, offsetStart = offset, offsetValue, length = 0, little = true, vr = null, tag;

    if (offset >= data.byteLength) {
        return null;
    }

    if (this.metaFinished) {
        little = this.littleEndian;
        group = data.getUint16(offset, little);
    } else {
        group = data.getUint16(offset, true);

        if (((this.metaFinishedOffset !== -1) && (offset >= this.metaFinishedOffset)) || (group !== 0x0002)) {
            this.metaFinished = true;
            little = this.littleEndian;
            group = data.getUint16(offset, little);
        } else {
            little = true;
        }
    }

    if (!this.metaFound && (group === 0x0002)) {
        this.metaFound = true;
    }

    offset += 2;

    element = data.getUint16(offset, true);
    offset += 2;

    if ((group === 0) && (element === 0)) {
        console.log("here");
    }

    if (this.explicit || !this.metaFinished) {
        vr = daikon.Utils.getStringAt(data, offset, 2);

        if (!this.metaFound && this.metaFinished && (daikon.Parser.VRS.indexOf(vr) === -1)) {
            vr = daikon.Dictionary.getVR(group, element);
            length = data.getUint32(offset, little);
            offset += 4;
            this.explicit = false;
        } else {
            offset += 2;

            if (daikon.Parser.DATA_VRS.indexOf(vr) !== -1) {
                offset += 2;  // skip two empty bytes

                length = data.getUint32(offset, little);
                offset += 4;
            } else {
                length = data.getUint16(offset, little);
                offset += 2;
            }
        }
    } else {
        vr = daikon.Dictionary.getVR(group, element);
        length = data.getUint32(offset, little);

        if (length === daikon.Parser.UNDEFINED_LENGTH) {
            vr = 'SQ';
        }

        offset += 4;
    }

    offsetValue = offset;

    if (vr === 'SQ') {
        value = this.parseSublist(data, offset, length);

        if (length === daikon.Parser.UNDEFINED_LENGTH) {
            length = value[value.length - 1].offsetEnd - offset;
        }
    } else if ((length > 0) && !testForTag) {
        value = data.buffer.slice(offset, offset + length);
    }

    offset += length;
    tag = new daikon.Tag(group, element, vr, value, offsetStart, offsetValue, offset, this.littleEndian);

    if (tag.isTransformSyntax()) {
        if (tag.value[0] === daikon.Parser.TRANSFER_SYNTAX_IMPLICIT_LITTLE) {
            this.explicit = false;
            this.littleEndian = true;
        } else if (tag.value[0] === daikon.Parser.TRANSFER_SYNTAX_EXPLICIT_LITTLE) {
            this.explicit = true;
            this.littleEndian = true;
        } else if (tag.value[0] === daikon.Parser.TRANSFER_SYNTAX_EXPLICIT_BIG) {
            this.explicit = true;
            this.littleEndian = false;
        }
    } else if (tag.isMetaLength()) {
        this.metaFinishedOffset = tag.value[0] + offset;
    }

    return tag;
};



daikon.Parser.prototype.parseSublist = function (data, offset, length) {
    var sublistItem,
        offsetEnd = offset + length,
        tags = [];

    if (length === daikon.Parser.UNDEFINED_LENGTH) {
        sublistItem = this.parseSublistItem(data, offset);

        while (!sublistItem.isSequenceDelim()) {
            tags.push(sublistItem);
            offset = sublistItem.offsetEnd;
            sublistItem = this.parseSublistItem(data, offset);
        }

        tags.push(sublistItem);
    } else {
        while (offset < offsetEnd) {
            sublistItem = this.parseSublistItem(data, offset);
            tags.push(sublistItem);
            offset = sublistItem.offsetEnd;
        }
    }

    return tags;
};



daikon.Parser.prototype.parseSublistItem = function (data, offset) {
    var group, element, length, offsetEnd, tag, offsetStart = offset, offsetValue, sublistItemTag, tags = [];

    group = data.getUint16(offset, this.littleEndian);
    offset += 2;

    element = data.getUint16(offset, this.littleEndian);
    offset += 2;

    length = data.getUint32(offset, this.littleEndian);
    offset += 4;

    offsetValue = offset;

    if (length === daikon.Parser.UNDEFINED_LENGTH) {
        tag = this.getNextTag(data, offset);

        while (!tag.isSublistItemDelim()) {
            tags.push(tag);
            offset = tag.offsetEnd;
            tag = this.getNextTag(data, offset);
        }

        tags.push(tag);
        offset = tag.offsetEnd;
    } else {
        offsetEnd = offset + length;

        while (offset < offsetEnd) {
            tag = this.getNextTag(data, offset);
            tags.push(tag);
            offset = tag.offsetEnd;
        }
    }

    sublistItemTag = new daikon.Tag(group, element, null, tags, offsetStart, offsetValue, offset, this.littleEndian);

    return sublistItemTag;
};



daikon.Parser.prototype.findFirstTagOffset = function (data) {
    var offset = 0,
        magicCookieLength = daikon.Parser.MAGIC_COOKIE.length,
        searchOffsetMax = daikon.Parser.MAGIC_COOKIE_OFFSET * 2,
        found = false,
        ctr = 0,
        ctrIn = 0,
        ch = 0;

    if (daikon.Parser.isMagicCookieFound(data)) {
        offset = daikon.Parser.MAGIC_COOKIE_OFFSET + magicCookieLength;
    } else {
        for (ctr = 0; ctr < searchOffsetMax; ctr += 1) {
            ch = data.getUint8(offset);
            if (ch === daikon.Parser.MAGIC_COOKIE[0]) {
                found = true;
                for (ctrIn = 1; ctrIn < magicCookieLength; ctrIn += 1) {
                    if (data.getUint8(ctr + ctrIn) !== daikon.Parser.MAGIC_COOKIE[ctrIn]) {
                        found = false;
                    }
                }

                if (found) {
                    offset = ctr;
                    break;
                }
            }
        }
    }

    return offset;
};



daikon.Parser.prototype.hasError = function () {
    return (this.error !== null);
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Parser;
}

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);
daikon.Image = daikon.Image || ((typeof require !== 'undefined') ? require('./image.js') : null);
daikon.OrderedMap = daikon.OrderedMap || ((typeof require !== 'undefined') ? require('./orderedmap.js') : null);
daikon.OrderedMapIterator = daikon.OrderedMapIterator || ((typeof require !== 'undefined') ? require('./iterator.js') : null);
daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);


/*** Constructor ***/
daikon.Series = daikon.Series || function () {
    this.images = [];
    this.imagesOriginalOrder = null;
    this.isMosaic = false;
    this.isElscint = false;
    this.isCompressed = false;
    this.numberOfFrames = 0;
    this.numberOfFramesInFile = 0;
    this.isMultiFrame = false;
    this.isMultiFrameVolume = false;
    this.isMultiFrameTimeseries = false;
    this.isImplicitTimeseries = false;
    this.sliceSense = false;
    this.sliceDir = daikon.Image.SLICE_DIRECTION_UNKNOWN;
    this.error = null;
};


/*** Static fields ***/
daikon.Series.parserError = null;


/*** Static Methods ***/

daikon.Series.parseImage = function (data) {
    var parser, image;

    parser = new daikon.Parser();
    image = parser.parse(data);

    if (parser.hasError()) {
        daikon.Series.parserError = parser.error;
        return null;
    }

    return image;
};



daikon.Series.getMosaicOffset = function (mosaicCols, mosaicColWidth, mosaicRowHeight, mosaicWidth, xLocVal,
                                          yLocVal, zLocVal) {
    var xLoc, yLoc, zLoc;

    xLoc = xLocVal;
    yLoc = yLocVal;
    zLoc = zLocVal;

    xLoc = ((zLoc % mosaicCols) * mosaicColWidth) + xLoc;
    yLoc = (((parseInt(zLoc / mosaicCols)) * mosaicRowHeight) + yLoc) * mosaicWidth;

    return (xLoc + yLoc);
};



daikon.Series.orderDicoms = function (images, numFrames, sliceDir) {
    var hasImagePosition, hasSliceLocation, hasImageNumber, timeMap, timeIt, ctr, ctrIn, dg, ordered,
        imagesOrderedByTimeAndSpace;

    hasImagePosition = (images[0].getImagePosition() !== null);
    hasSliceLocation = (images[0].getSliceLocation() !== null);
    hasImageNumber = (images[0].getImageNumber() !== null);

    timeMap = daikon.Series.orderByTime(images, numFrames, sliceDir, hasImagePosition, hasSliceLocation);
    timeIt = timeMap.orderedKeys;

    imagesOrderedByTimeAndSpace = [];

    for (ctr = 0; ctr < timeIt.length; ctr += 1) {
        dg = timeMap.get(timeIt[ctr]);

        if (hasImagePosition) {
            ordered = daikon.Series.orderByImagePosition(dg, sliceDir);
        } else if (hasSliceLocation) {
            ordered = daikon.Series.orderBySliceLocation(dg);
        } else if (hasImageNumber) {
            ordered = daikon.Series.orderByImageNumber(dg);
        } else {
            ordered = dg;
        }

        for (ctrIn = 0; ctrIn < ordered.length; ctrIn += 1) {
            imagesOrderedByTimeAndSpace.push(ordered[ctrIn]);
        }
    }

    for (ctrIn = 0; ctrIn < imagesOrderedByTimeAndSpace.length; ctrIn += 1) {
        imagesOrderedByTimeAndSpace[ctrIn].index = ctrIn;
    }

    return imagesOrderedByTimeAndSpace;
};



daikon.Series.orderByImagePosition = function (images, sliceDir) {
    var dicomMap, ctr;
    dicomMap = new daikon.OrderedMap();

    for (ctr = 0; ctr < images.length; ctr += 1) {
        dicomMap.put(images[ctr].getImagePositionSliceDir(sliceDir), images[ctr]);
    }

    return dicomMap.getOrderedValues();
};



daikon.Series.orderBySliceLocation = function (images) {
    var dicomMap, ctr;
    dicomMap = new daikon.OrderedMap();

    for (ctr = 0; ctr < images.length; ctr += 1) {
        dicomMap.put(images[ctr].getSliceLocation(), images[ctr]);
    }

    return dicomMap.getOrderedValues();
};



daikon.Series.orderByImageNumber = function (images) {
    var dicomMap, ctr;
    dicomMap = new daikon.OrderedMap();

    for (ctr = 0; ctr < images.length; ctr += 1) {
        dicomMap.put(images[ctr].getImageNumber(), images[ctr]);
    }

    return dicomMap.getOrderedValues();
};



daikon.Series.hasMatchingSlice = function (dg, image, sliceDir, doImagePos, doSliceLoc) {
    var matchingNum = 0, ctr, current, imagePos, sliceLoc, imageNum;

    if (doImagePos) {
        matchingNum = image.getImagePositionSliceDir(sliceDir);
    } else if (doSliceLoc) {
        matchingNum = image.getSliceLocation();
    } else {
        matchingNum = image.getImageNumber();
    }

    for (ctr = 0; ctr < dg.length; ctr += 1) {
        current = dg[ctr];

        if (doImagePos) {
            imagePos = current.getImagePositionSliceDir(sliceDir);
            if (imagePos === matchingNum) {
                return true;
            }
        } else if (doSliceLoc) {
            sliceLoc = current.getSliceLocation();
            if (sliceLoc === matchingNum) {
                return true;
            }
        } else {
            imageNum = current.getImageNumber();
            if (imageNum === matchingNum) {
                return true;
            }
        }
    }

    return false;
};



daikon.Series.orderByTime = function (images, numFrames, sliceDir, hasImagePosition, hasSliceLocation) {
    var dicomMap, hasTemporalPosition, hasTemporalNumber, ctr, image, tempPos, dg, timeBySliceMap, imageNum,
        sliceMarker, slice, dicomsCopy, dicomsCopyIndex, sliceIt, timeIt, dgFound, it;

    dicomMap = new daikon.OrderedMap();
    hasTemporalPosition = (numFrames > 1) && (images[0].getTemporalPosition() !== null);
    hasTemporalNumber = (numFrames > 1) && (images[0].getTemporalNumber() !== null) && (images[0].getTemporalNumber() === numFrames);

    if (hasTemporalPosition && hasTemporalNumber) { // explicit series
        for (ctr = 0; ctr < images.length; ctr += 1) {
            image = images[ctr];

            tempPos = image.getTemporalPosition();
            dg = dicomMap.get(tempPos);
            if (!dg) {
                dg = [];
                dicomMap.put(tempPos, dg);
            }

            dg.push(image);
        }
    } else { // implicit series
        // order data by slice then time
        timeBySliceMap = new daikon.OrderedMap();
        for (ctr = 0; ctr < images.length; ctr += 1) {
            if (images[ctr] !== null) {
                imageNum = images[ctr].getImageNumber();
                sliceMarker = ctr;
                if (hasImagePosition) {
                    sliceMarker = images[ctr].getImagePositionSliceDir(sliceDir);
                } else if (hasSliceLocation) {
                    sliceMarker = images[ctr].getSliceLocation();
                }

                slice = timeBySliceMap.get(sliceMarker);
                if (slice === null) {
                    slice = new daikon.OrderedMap();
                    timeBySliceMap.put(sliceMarker, slice);
                }

                slice.put(imageNum, images[ctr]);
            }
        }

        // copy into DICOM array (ordered by slice by time)
        dicomsCopy = [];
        dicomsCopyIndex = 0;
        sliceIt = timeBySliceMap.iterator();
        while (sliceIt.hasNext()) {
            slice = sliceIt.next();
            timeIt = slice.iterator();
            while (timeIt.hasNext()) {
                dicomsCopy[dicomsCopyIndex] = timeIt.next();
                dicomsCopyIndex += 1;
            }
        }

        // groups dicoms by timepoint
        for (ctr = 0; ctr < dicomsCopy.length; ctr += 1) {
            if (dicomsCopy[ctr] !== null) {
                dgFound = null;
                it = dicomMap.iterator();
                while (it.hasNext()) {
                    dg = it.next();
                    if (!daikon.Series.hasMatchingSlice(dg, dicomsCopy[ctr], sliceDir, hasImagePosition, hasSliceLocation)) {
                        dgFound = dg;
                        break;
                    }
                }

                if (dgFound === null) {
                    dgFound = [];
                    dicomMap.put(dicomMap.orderedKeys.length, dgFound);
                }

                dgFound.push(dicomsCopy[ctr]);
            }
        }
    }

    return dicomMap;
};


/*** Prototype Methods ***/

daikon.Series.prototype.getOrder = function () {
    var ctr, order = [];

    for (ctr = 0; ctr < this.imagesOriginalOrder.length; ctr += 1) {
        order[ctr] = this.imagesOriginalOrder[ctr].index;
    }

    return order;
};



daikon.Series.prototype.toString = function () {
    return this.images[0].getSeriesId();
};



daikon.Series.prototype.getName = function () {
    var des = this.images[0].getSeriesDescription();
    var uid = this.images[0].getSeriesInstanceUID();

    if (des !== null) {
        return des;
    }

    if (uid !== null) {
        return uid;
    }

    return null;
};



daikon.Series.prototype.addImage = function (image) {
    this.images.push(image);
};



daikon.Series.prototype.matchesSeries = function (image) {
    if (this.images.length === 0) {
        return true;
    }

    return (this.images[0].getSeriesId() === image.getSeriesId());
};



daikon.Series.prototype.buildSeries = function () {
    var hasFrameTime, ctr, sliceLoc, orderedImages, sliceLocationFirst, sliceLocationLast, sliceLocDiff,
        sliceLocations, orientation, imagePos;

    this.isMosaic = this.images[0].isMosaic();
    this.isElscint = this.images[0].isElscint();
    this.isCompressed = this.images[0].isCompressed();

    // check for multi-frame
    this.numberOfFrames = this.images[0].getNumberOfFrames();
    this.numberOfFramesInFile = this.images[0].getNumberOfImplicitFrames();
    this.isMultiFrame = (this.numberOfFrames > 1) || (this.isMosaic && (this.images[0].length > 1));
    this.isMultiFrameVolume = false;
    this.isMultiFrameTimeseries = false;
    this.isImplicitTimeseries = false;

    if (this.isMultiFrame) {
        hasFrameTime = (this.images[0].getFrameTime() > 0);
        if (this.isMosaic) {
            this.isMultiFrameTimeseries = true;
        } else {
            if (hasFrameTime) {
                this.isMultiFrameTimeseries = true;
            } else if (this.numberOfFramesInFile > 1) {
                this.isMultiFrameTimeseries = true;
                this.numberOfFrames = this.images.length;
            } else {
                this.isMultiFrameVolume = true;
            }
        }
    }

    if (!this.isMosaic && (this.numberOfFrames <= 1)) { // check for implicit frame count
        imagePos = (this.images[0].getImagePosition() || []);
        sliceLoc = imagePos.toString();
        this.numberOfFrames = 0;

        for (ctr = 0; ctr < this.images.length; ctr += 1) {
            imagePos = (this.images[ctr].getImagePosition() || []);

            if (imagePos.toString() === sliceLoc) {
                this.numberOfFrames += 1;
            }
        }

        if (this.numberOfFrames > 1) {
            this.isImplicitTimeseries = true;
        }
    }

    this.sliceDir = this.images[0].getAcquiredSliceDirection();
    orderedImages = daikon.Series.orderDicoms(this.images, this.numberOfFrames, this.sliceDir);

    sliceLocationFirst = orderedImages[0].getImagePositionSliceDir(this.sliceDir);
    sliceLocationLast = orderedImages[orderedImages.length - 1].getImagePositionSliceDir(this.sliceDir);
    sliceLocDiff = sliceLocationLast - sliceLocationFirst;

    if (this.isMosaic) {
        this.sliceSense = true;
    } else if (this.isMultiFrame) {
        sliceLocations = orderedImages[0].getSliceLocationVector();
        if (sliceLocations !== null) {
            orientation = orderedImages[0].getOrientation();

            if (orientation.charAt(2) === 'Z') {
                this.sliceSense = (sliceLocations[0] - sliceLocations[sliceLocations.length - 1]) < 0;
            } else {
                this.sliceSense = (sliceLocations[0] - sliceLocations[sliceLocations.length - 1]) > 0;
            }
        } else {
            this.sliceSense = sliceLocationFirst < 0 ? false : true; // maybe???
        }
    } else {
        /*
         * "The direction of the axes is defined fully by the patient's orientation. The x-axis is increasing to the left hand side of the patient. The
         * y-axis is increasing to the posterior side of the patient. The z-axis is increasing toward the head of the patient."
         */
        if ((this.sliceDir === daikon.Image.SLICE_DIRECTION_SAGITTAL) || (this.sliceDir === daikon.Image.SLICE_DIRECTION_CORONAL)) {
            if (sliceLocDiff > 0) {
                this.sliceSense = false;
            } else {
                this.sliceSense = true;
            }
        } else {
            if (sliceLocDiff > 0) {
                this.sliceSense = true;
            } else {
                this.sliceSense = false;
            }
        }
    }

    this.imagesOriginalOrder = this.images;
    this.images = orderedImages;
};



daikon.Series.prototype.concatenateImageData = function (progressMeter, onFinishedImageRead) {
    var buffer;

    if (this.isMosaic) {
        buffer = this.getMosaicData(this.images[0], this.images[0].getPixelData().value.buffer);
        this.images[0].clearPixelData();
    } else {
        buffer = this.images[0].getPixelData().value.buffer;
        this.images[0].clearPixelData();
    }

    setTimeout(this.concatenateNextImageData(buffer, progressMeter, 1, onFinishedImageRead), 0);
};



daikon.Series.prototype.concatenateNextImageData = function (buffer, progressMeter, index, onFinishedImageRead) {
    if (index >= this.images.length) {
        if (progressMeter) {
            progressMeter.drawProgress(1, "Reading DICOM Images");
        }

        onFinishedImageRead(buffer);
    } else {
        if (progressMeter) {
            progressMeter.drawProgress(index / this.images.length, "Reading DICOM Images");
        }

        if (this.isMosaic) {
            buffer = daikon.Utils.concatArrayBuffers(buffer, this.getMosaicData(this.images[index], this.images[index].getPixelData().value.buffer));
            this.images[index].clearPixelData();
        } else {
            buffer = daikon.Utils.concatArrayBuffers(buffer, this.images[index].getPixelData().value.buffer);
            this.images[index].clearPixelData();
        }

        setTimeout(daikon.Utils.bind(this, function() {this.concatenateNextImageData(buffer, progressMeter, index + 1, onFinishedImageRead);}), 0);
    }
};



daikon.Series.prototype.getMosaicData = function (image, data) {
    var mosaicWidth, mosaicHeight, mosaicRows, mosaicCols, mosaicRowHeight, mosaicColWidth,
        numBytes, ctrS, ctrR, ctrC, numSlices, numRows, numCols, buffer, dataTyped, offset, ctr, index = 0;

    numBytes = parseInt(this.images[0].getBitsAllocated() / 8);
    numSlices = this.images[0].getMosaicCols() * this.images[0].getMosaicRows();
    numRows = parseInt(this.images[0].getRows() / this.images[0].getMosaicRows());
    numCols = parseInt(this.images[0].getCols() / this.images[0].getMosaicCols());

    mosaicWidth = this.images[0].getCols();
    mosaicHeight = this.images[0].getRows();
    mosaicRows = this.images[0].getMosaicRows();
    mosaicCols = this.images[0].getMosaicCols();
    mosaicRowHeight = parseInt(mosaicHeight / mosaicRows);
    mosaicColWidth = parseInt(mosaicWidth / mosaicCols);

    buffer = new Uint8Array(new ArrayBuffer(numSlices * numRows * numCols * numBytes));
    dataTyped = new Uint8Array(data);

    for (ctrS = 0; ctrS < numSlices; ctrS += 1) {
        for (ctrR = 0; ctrR < numRows; ctrR += 1) {
            for (ctrC = 0; ctrC < numCols; ctrC += 1) {
                offset = daikon.Series.getMosaicOffset(mosaicCols, mosaicColWidth, mosaicRowHeight, mosaicWidth, ctrC,
                    ctrR, ctrS);
                for (ctr = 0; ctr < numBytes; ctr += 1) {
                    buffer[index] = dataTyped[(offset * numBytes) + ctr];
                    index += 1;
                }
            }
        }
    }

    return buffer.buffer;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Series;
}

/*jslint browser: true, node: true */
/*global require */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);
daikon.Dictionary = daikon.Dictionary || ((typeof require !== 'undefined') ? require('./dictionary.js') : null);


/*** Constructor ***/
daikon.Tag = daikon.Tag || function (group, element, vr, value, offsetStart, offsetValue, offsetEnd, littleEndian) {
    this.group = group;
    this.element = element;
    this.vr = vr;
    this.offsetStart = offsetStart;
    this.offsetValue = offsetValue;
    this.offsetEnd = offsetEnd;
    this.sublist = false;
    this.id = daikon.Tag.createId(group, element);

    if (value instanceof Array) {
        this.value = value;
        this.sublist = true;
    } else if (value !== null) {
        this.value = daikon.Tag.convertValue(vr, new DataView(value), littleEndian);
    } else {
        this.value = null;
    }
};


/*** Static Pseudo-constants ***/

daikon.Tag.VR_AE_MAX_LENGTH = 16;
daikon.Tag.VR_AS_MAX_LENGTH = 4;
daikon.Tag.VR_AT_MAX_LENGTH = 4;
daikon.Tag.VR_CS_MAX_LENGTH = 16;
daikon.Tag.VR_DA_MAX_LENGTH = 8;
daikon.Tag.VR_DS_MAX_LENGTH = 16;
daikon.Tag.VR_DT_MAX_LENGTH = 26;
daikon.Tag.VR_FL_MAX_LENGTH = 4;
daikon.Tag.VR_FD_MAX_LENGTH = 8;
daikon.Tag.VR_IS_MAX_LENGTH = 12;
daikon.Tag.VR_LO_MAX_LENGTH = 64;
daikon.Tag.VR_LT_MAX_LENGTH = 10240;
daikon.Tag.VR_OB_MAX_LENGTH = -1;
daikon.Tag.VR_OD_MAX_LENGTH = -1;
daikon.Tag.VR_OF_MAX_LENGTH = -1;
daikon.Tag.VR_OW_MAX_LENGTH = -1;
daikon.Tag.VR_PN_MAX_LENGTH = 64 * 5;
daikon.Tag.VR_SH_MAX_LENGTH = 16;
daikon.Tag.VR_SL_MAX_LENGTH = 4;
daikon.Tag.VR_SS_MAX_LENGTH = 2;
daikon.Tag.VR_ST_MAX_LENGTH = 1024;
daikon.Tag.VR_TM_MAX_LENGTH = 16;
daikon.Tag.VR_UI_MAX_LENGTH = 64;
daikon.Tag.VR_UL_MAX_LENGTH = 4;
daikon.Tag.VR_UN_MAX_LENGTH = -1;
daikon.Tag.VR_US_MAX_LENGTH = 2;
daikon.Tag.VR_UT_MAX_LENGTH = -1;

// metadata
daikon.Tag.TAG_TRANSFER_SYNTAX = [0x0002, 0x0010];
daikon.Tag.TAG_META_LENGTH = [0x0002, 0x0000];

// sublists
daikon.Tag.TAG_SUBLIST_ITEM = [0xFFFE, 0xE000];
daikon.Tag.TAG_SUBLIST_ITEM_DELIM = [0xFFFE, 0xE00D];
daikon.Tag.TAG_SUBLIST_SEQ_DELIM = [0xFFFE, 0xE0DD];

// image dims
daikon.Tag.TAG_ROWS = [0x0028, 0x0010];
daikon.Tag.TAG_COLS = [0x0028, 0x0011];
daikon.Tag.TAG_ACQUISITION_MATRIX = [0x0018, 0x1310];
daikon.Tag.TAG_NUMBER_OF_FRAMES = [0x0028, 0x0008];
daikon.Tag.TAG_NUMBER_TEMPORAL_POSITIONS = [0x0020, 0x0105];

// voxel dims
daikon.Tag.TAG_PIXEL_SPACING = [0x0028, 0x0030];
daikon.Tag.TAG_SLICE_THICKNESS = [0x0018, 0x0050];
daikon.Tag.TAG_SLICE_GAP = [0x0018, 0x0088];
daikon.Tag.TAG_TR = [0x0018, 0x0080];
daikon.Tag.TAG_FRAME_TIME = [0x0018, 0x1063];

// datatype
daikon.Tag.TAG_BITS_ALLOCATED = [0x0028, 0x0100];
daikon.Tag.TAG_BITS_STORED = [0x0028, 0x0101];
daikon.Tag.TAG_PIXEL_REPRESENTATION = [0x0028, 0x0103];
daikon.Tag.TAG_HIGH_BIT = [0x0028, 0x0102];
daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION = [0x0028, 0x0004];
daikon.Tag.TAG_SAMPLES_PER_PIXEL = [0x0028, 0x0002];

// data scale
daikon.Tag.TAG_DATA_SCALE_SLOPE = [0x0028, 0x1053];
daikon.Tag.TAG_DATA_SCALE_INTERCEPT = [0x0028, 0x1052];
daikon.Tag.TAG_DATA_SCALE_ELSCINT = [0x0207, 0x101F];
daikon.Tag.TAG_PIXEL_BANDWIDTH = [0x0018, 0x0095];

// range
daikon.Tag.TAG_IMAGE_MIN = [0x0028, 0x0106];
daikon.Tag.TAG_IMAGE_MAX = [0x0028, 0x0107];
daikon.Tag.TAG_WINDOW_CENTER = [0x0028, 0x1050];
daikon.Tag.TAG_WINDOW_WIDTH = [0x0028, 0x1051];

// descriptors
daikon.Tag.TAG_PATIENT_NAME = [0x0010, 0x0010];
daikon.Tag.TAG_PATIENT_ID = [0x0010, 0x0020];
daikon.Tag.TAG_STUDY_DATE = [0x0008, 0x0020];
daikon.Tag.TAG_STUDY_TIME = [0x0008, 0x0030];
daikon.Tag.TAG_STUDY_DES = [0x0008, 0x1030];
daikon.Tag.TAG_IMAGE_TYPE = [0x0008, 0x0008];
daikon.Tag.TAG_IMAGE_COMMENTS = [0x0020, 0x4000];
daikon.Tag.TAG_SEQUENCE_NAME = [0x0018, 0x0024];
daikon.Tag.TAG_MODALITY = [0x0008, 0x0060];

// session ID
daikon.Tag.TAG_FRAME_OF_REF_UID = [0x0020, 0x0052];

// study ID
daikon.Tag.TAG_STUDY_UID = [0x0020, 0x000D];

// volume ID
daikon.Tag.TAG_SERIES_DESCRIPTION = [0x0008, 0x103E];
daikon.Tag.TAG_SERIES_INSTANCE_UID = [0x0020, 0x000E];
daikon.Tag.TAG_SERIES_NUMBER = [0x0020, 0x0011];
daikon.Tag.TAG_ECHO_NUMBER = [0x0018, 0x0086];
daikon.Tag.TAG_TEMPORAL_POSITION = [0x0020, 0x0100];

// slice ID
daikon.Tag.TAG_IMAGE_NUM = [0x0020, 0x0013];
daikon.Tag.TAG_SLICE_LOCATION = [0x0020, 0x1041];

// orientation
daikon.Tag.TAG_IMAGE_ORIENTATION = [0x0020, 0x0037];
daikon.Tag.TAG_IMAGE_POSITION = [0x0020, 0x0032];
daikon.Tag.TAG_SLICE_LOCATION_VECTOR = [0x0018, 0x2005];

// pixel data
daikon.Tag.TAG_PIXEL_DATA = [0x7FE0, 0x0010];


/*** Static methods ***/

daikon.Tag.createId = function (group, element) {
    var groupStr = daikon.Utils.dec2hex(group),
        elemStr = daikon.Utils.dec2hex(element);
    return groupStr + elemStr;
};



daikon.Tag.getUnsignedInteger16 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 2;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getUint16(ctr * 2, littleEndian);
    }

    return data;
};



daikon.Tag.getSignedInteger16 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 2;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getInt16(ctr * 2, littleEndian);
    }

    return data;
};



daikon.Tag.getFloat32 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 4;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getFloat32(ctr * 4, littleEndian);
    }

    return data;
};



daikon.Tag.getSignedInteger32 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 4;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getInt32(ctr * 4, littleEndian);
    }

    return data;
};



daikon.Tag.getUnsignedInteger32 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 4;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getUint32(ctr * 4, littleEndian);
    }

    return data;
};



daikon.Tag.getFloat64 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 8;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getFloat64(ctr * 8, littleEndian);
    }

    return data;
};



daikon.Tag.getDoubleElscint = function (rawData) {
    var data = [], reordered = [], ctr;

    for (ctr = 0; ctr < 8; ctr += 1) {
        data[ctr] = rawData.getUint8(ctr);
    }

    reordered[0] = data[3];
    reordered[1] = data[2];
    reordered[2] = data[1];
    reordered[3] = data[0];
    reordered[4] = data[7];
    reordered[5] = data[6];
    reordered[6] = data[5];
    reordered[7] = data[4];

    data = [daikon.Utils.bytesToDouble(reordered)];

    return data;
};



daikon.Tag.getFixedLengthStringValue = function (rawData, maxLength) {
    var data, mul, ctr;

    mul = Math.floor(rawData.byteLength / maxLength);
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = daikon.Utils.getStringAt(rawData, ctr * maxLength, maxLength);
    }

    return data;
};



daikon.Tag.getStringValue = function (rawData) {
    var data = daikon.Utils.getStringAt(rawData, 0, rawData.byteLength).split('\\'), ctr;

    for (ctr = 0; ctr < data.length; ctr += 1) {
        data[ctr] = daikon.Utils.trim(data[ctr]);
    }

    return data;
};



daikon.Tag.getDateStringValue = function (rawData) {
    var dotFormat = (daikon.Tag.getSingleStringValue(rawData)[0].indexOf('.') !== -1),
        stringData = daikon.Tag.getFixedLengthStringValue(rawData, dotFormat ? 10 : daikon.Tag.VR_DA_MAX_LENGTH),
        parts = null,
        data = [],
        ctr;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        if (dotFormat) {
            parts = stringData[ctr].split('.');
            data[ctr] = new Date(daikon.Utils.safeParseInt(parts[0]),
                daikon.Utils.safeParseInt(parts[1]) - 1,
                daikon.Utils.safeParseInt(parts[2]));
        } else if (stringData[ctr].length === 8) {
            data[ctr] = new Date(daikon.Utils.safeParseInt(stringData[ctr].substring(0, 4)),
                daikon.Utils.safeParseInt(stringData[ctr].substring(4, 6)) - 1,
                daikon.Utils.safeParseInt(stringData[ctr].substring(6, 8)));
        } else {
            data[ctr] = Date.parse(stringData[ctr]);
        }
    }

    return data;
};



daikon.Tag.getDateTimeStringValue = function (rawData) {
    var stringData = daikon.Tag.getStringValue(rawData),
        data = [],
        ctr,
        year = null,
        month = null,
        date = null,
        hours = null,
        minutes = null,
        seconds = null;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        if (stringData[ctr].length >= 4) {
            year = parseInt(stringData[ctr].substring(0, 4), 10);  // required

            if (stringData[ctr].length >= 6) {
                month = daikon.Utils.safeParseInt(stringData[ctr].substring(4, 6)) - 1;
            }

            if (stringData[ctr].length >= 8) {
                date = daikon.Utils.safeParseInt(stringData[ctr].substring(6, 8));
            }

            if (stringData[ctr].length >= 10) {
                hours = daikon.Utils.safeParseInt(stringData[ctr].substring(8, 10));
            }

            if (stringData[ctr].length >= 12) {
                minutes = daikon.Utils.safeParseInt(stringData[ctr].substring(10, 12));
            }

            if (stringData[ctr].length >= 14) {
                seconds = daikon.Utils.safeParseInt(stringData[ctr].substring(12, 14));
            }

            data[ctr] = new Date(year, month, date, hours, minutes, seconds);
        } else {
            data[ctr] = Date.parse(stringData[ctr]);
        }
    }

    return data;
};



daikon.Tag.getTimeStringValue = function (rawData) {
    var stringData = daikon.Tag.getStringValue(rawData),
        data = [],
        parts = null,
        ctr,
        hours = 0,
        minutes = 0,
        seconds = 0;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        if (stringData[ctr].indexOf(':') !== -1) {
            parts = stringData[ctr].split(':');
            hours = daikon.Utils.safeParseInt(parts[0]);

            if (parts.length > 1) {
                minutes = daikon.Utils.safeParseInt(parts[1]);
            }

            if (parts.length > 2) {
                seconds = daikon.Utils.safeParseFloat(parts[2]);
            }
        } else {
            if (stringData[ctr].length >= 2) {
                hours = daikon.Utils.safeParseInt(stringData[ctr].substring(0, 2));
            }

            if (stringData[ctr].length >= 4) {
                minutes = daikon.Utils.safeParseInt(stringData[ctr].substring(2, 4));
            }

            if (stringData[ctr].length >= 6) {
                seconds = daikon.Utils.safeParseFloat(stringData[ctr].substring(4));
            }
        }

        data[ctr] = Math.round((hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000));
    }

    return data;
};



daikon.Tag.getDoubleStringValue = function (rawData) {
    var stringData = daikon.Tag.getStringValue(rawData),
        data = [],
        ctr;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        data[ctr] = parseFloat(stringData[ctr]);
    }

    return data;
};



daikon.Tag.getIntegerStringValue = function (rawData) {
    var stringData = daikon.Tag.getStringValue(rawData),
        data = [],
        ctr;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        data[ctr] = parseInt(stringData[ctr], 10);
    }

    return data;
};



daikon.Tag.getSingleStringValue = function (rawData) {
    return [daikon.Utils.trim(daikon.Utils.getStringAt(rawData, 0, rawData.byteLength))];
};



daikon.Tag.getPersonNameStringValue = function (rawData) {
    var stringData = daikon.Tag.getStringValue(rawData),
        data = [],
        ctr;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        data[ctr] = stringData[ctr].replace('^', ' ');
    }

    return data;
};



daikon.Tag.convertValue = function (vr, rawData, littleEndian) {
    var data = null;

    if (vr === 'AE') {
        data = daikon.Tag.getSingleStringValue(rawData, daikon.Tag.VR_AE_MAX_LENGTH);
    } else if (vr === 'AS') {
        data = daikon.Tag.getFixedLengthStringValue(rawData, daikon.Tag.VR_AS_MAX_LENGTH);
    } else if (vr === 'AT') {
        data = daikon.Tag.getUnsignedInteger16(rawData, littleEndian);
    } else if (vr === 'CS') {
        data = daikon.Tag.getStringValue(rawData);
    } else if (vr === 'DA') {
        data = daikon.Tag.getDateStringValue(rawData);
    } else if (vr === 'DS') {
        data = daikon.Tag.getDoubleStringValue(rawData);
    } else if (vr === 'DT') {
        data = daikon.Tag.getDateTimeStringValue(rawData);
    } else if (vr === 'FL') {
        data = daikon.Tag.getFloat32(rawData, littleEndian);
    } else if (vr === 'FD') {
        data = daikon.Tag.getFloat64(rawData, littleEndian);
    } else if (vr === 'FE') {  // special Elscint double (see dictionary)
        data = daikon.Tag.getDoubleElscint(rawData, littleEndian);
    } else if (vr === 'IS') {
        data = daikon.Tag.getIntegerStringValue(rawData);
    } else if (vr === 'LO') {
        data = daikon.Tag.getStringValue(rawData);
    } else if (vr === 'LT') {
        data = daikon.Tag.getSingleStringValue(rawData);
    } else if (vr === 'OB') {
        data = rawData;
    } else if (vr === 'OD') {
        data = rawData;
    } else if (vr === 'OF') {
        data = rawData;
    } else if (vr === 'OW') {
        data = rawData;
    } else if (vr === 'PN') {
        data = daikon.Tag.getPersonNameStringValue(rawData);
    } else if (vr === 'SH') {
        data = daikon.Tag.getStringValue(rawData);
    } else if (vr === 'SL') {
        data = daikon.Tag.getSignedInteger32(rawData, littleEndian);
    } else if (vr === 'SQ') {
        data = null;
    } else if (vr === 'SS') {
        data = daikon.Tag.getSignedInteger16(rawData, littleEndian);
    } else if (vr === 'ST') {
        data = daikon.Tag.getSingleStringValue(rawData);
    } else if (vr === 'TM') {
        data = daikon.Tag.getTimeStringValue(rawData);
    } else if (vr === 'UI') {
        data = daikon.Tag.getStringValue(rawData);
    } else if (vr === 'UL') {
        data = daikon.Tag.getUnsignedInteger32(rawData, littleEndian);
    } else if (vr === 'UN') {
        data = rawData;
    } else if (vr === 'US') {
        data = daikon.Tag.getUnsignedInteger16(rawData, littleEndian);
    } else if (vr === 'UT') {
        data = daikon.Tag.getSingleStringValue(rawData);
    }

    return data;
};


/*** Prototype Methods ***/

daikon.Tag.prototype.toString = function (level) {
    var valueStr = '',
        ctr,
        groupStr = daikon.Utils.dec2hex(this.group),
        elemStr = daikon.Utils.dec2hex(this.element),
        tagStr = '(' + groupStr + ',' + elemStr + ')',
        des = '',
        padding;

    if (level === undefined) {
        level = 0;
    }

    padding = "";
    for (ctr = 0; ctr < level; ctr += 1) {
        padding += "  ";
    }

    if (this.sublist) {
        for (ctr = 0; ctr < this.value.length; ctr += 1) {
            valueStr += ('\n' + (this.value[ctr].toString(level + 1)));
        }
    } else if (this.vr === 'SQ') {
        valueStr = '';
    } else if (this.isPixelData()) {
        valueStr = '';
    } else if (!this.value) {
        valueStr = '';
    } else {
        valueStr = '[' + this.value + ']';
    }

    if (this.isSublistItem()) {
        tagStr = "Sequence Item";
    } else if (this.isSublistItemDelim()) {
        tagStr = "Sequence Item Delimiter";
    } else if (this.isSequenceDelim()) {
        tagStr = "Sequence Delimiter";
    } else if (this.isPixelData()) {
        tagStr = "Pixel Data";
    } else {
        des = daikon.Utils.convertCamcelCaseToTitleCase(daikon.Dictionary.getDescription(this.group, this.element));
    }

    return padding + tagStr + ' ' + des + ' ' + valueStr;
};



daikon.Tag.prototype.isTransformSyntax = function () {
    return (this.group === daikon.Tag.TAG_TRANSFER_SYNTAX[0]) && (this.element === daikon.Tag.TAG_TRANSFER_SYNTAX[1]);
};



daikon.Tag.prototype.isPixelData = function () {
    return (this.group === daikon.Tag.TAG_PIXEL_DATA[0]) && (this.element === daikon.Tag.TAG_PIXEL_DATA[1]);
};



daikon.Tag.prototype.isSublistItem = function () {
    return (this.group === daikon.Tag.TAG_SUBLIST_ITEM[0]) && (this.element === daikon.Tag.TAG_SUBLIST_ITEM[1]);
};



daikon.Tag.prototype.isSublistItemDelim = function () {
    return (this.group === daikon.Tag.TAG_SUBLIST_ITEM_DELIM[0]) && (this.element === daikon.Tag.TAG_SUBLIST_ITEM_DELIM[1]);
};



daikon.Tag.prototype.isSequenceDelim = function () {
    return (this.group === daikon.Tag.TAG_SUBLIST_SEQ_DELIM[0]) && (this.element === daikon.Tag.TAG_SUBLIST_SEQ_DELIM[1]);
};



daikon.Tag.prototype.isMetaLength = function () {
    return (this.group === daikon.Tag.TAG_META_LENGTH[0]) && (this.element === daikon.Tag.TAG_META_LENGTH[1]);
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Tag;
}

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Utils = daikon.Utils || {};


/*** Static methods ***/

daikon.Utils.dec2hex = function (i) {
    return (i + 0x10000).toString(16).substr(-4).toUpperCase();
};



daikon.Utils.getStringAt = function (dataview, start, length) {
    var str = "", ctr, ch;

    for (ctr = 0; ctr < length; ctr += 1) {
        ch = dataview.getUint8(start + ctr);

        if (ch !== 0) {
            str += String.fromCharCode(ch);
        }
    }

    return str;
};



daikon.Utils.trim = function (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};



daikon.Utils.stripLeadingZeros = function (str) {
    return str.replace(/^[0]+/g, "");
};



daikon.Utils.safeParseInt = function (str) {
    str = daikon.Utils.stripLeadingZeros(str);
    if (str.length > 0) {
        return parseInt(str, 10);
    }

    return 0;
};



daikon.Utils.convertCamcelCaseToTitleCase = function (str) {
    var result = str.replace(/([A-Z][a-z])/g, " $1");
    return daikon.Utils.trim(result.charAt(0).toUpperCase() + result.slice(1));
};



daikon.Utils.safeParseFloat = function (str) {
    str = daikon.Utils.stripLeadingZeros(str);
    if (str.length > 0) {
        return parseFloat(str);
    }

    return 0;
};


// http://stackoverflow.com/questions/8361086/convert-byte-array-to-numbers-in-javascript
daikon.Utils.bytesToDouble = function (data) {
    var sign = (data[0] & 1<<7)>>7;

    var exponent = (((data[0] & 127) << 4) | (data[1]&(15<<4))>>4);

    if(exponent == 0) return 0;
    if(exponent == 0x7ff) return (sign) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

    var mul = Math.pow(2,exponent - 1023 - 52);
    var mantissa = data[7]+
        data[6]*Math.pow(2,8*1)+
        data[5]*Math.pow(2,8*2)+
        data[4]*Math.pow(2,8*3)+
        data[3]*Math.pow(2,8*4)+
        data[2]*Math.pow(2,8*5)+
        (data[1]&15)*Math.pow(2,8*6)+
        Math.pow(2,52);

    return Math.pow(-1,sign)*mantissa*mul;
};



daikon.Utils.concatArrayBuffers = function (buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};



daikon.Utils.bind = function (scope, fn, args, appendArgs) {
    if (arguments.length === 2) {
        return function () {
            return fn.apply(scope, arguments);
        };
    }

    var method = fn,
        slice = Array.prototype.slice;

    return function () {
        var callArgs = args || arguments;

        if (appendArgs === true) {
            callArgs = slice.call(arguments, 0);
            callArgs = callArgs.concat(args);
        } else if (typeof appendArgs === 'number') {
            callArgs = slice.call(arguments, 0); // copy arguments first
            Ext.Array.insert(callArgs, appendArgs, args);
        }

        return method.apply(scope || window, callArgs);
    };
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Utils;
}
