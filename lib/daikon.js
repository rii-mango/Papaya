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
daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);


/*** Static Pseudo-constants ***/

daikon.Dictionary.dictPrivate = {
    "0207" : {
        "101F" : ["FE", "ElscintDataScale"] // uses special Elscint double type (see Tag class)
    }
};


daikon.Dictionary.dict = {
    "0002" : {
        "0000" : ["UL", "Group0002Length"],
        "0001" : ["OB", "FileMetaInformationVersion"],
        "0002" : ["UI", "MediaStoredSOPClassUID"],
        "0003" : ["UI", "MediaStoredSOPInstanceUID"],
        "0010" : ["UI", "TransferSyntaxUID"],
        "0012" : ["UI", "ImplementationClassUID"],
        "0013" : ["SH", "ImplementationVersionName"],
        "0016" : ["AE", "SourceApplicationEntityTitle"],
        "0100" : ["UI", "PrivateInformationCreatorUID"],
        "0102" : ["OB", "PrivateInformation"]
    },
    "0004" : {
        "0000" : ["UL", "Group0004Length"],
        "1130" : ["CS", "FilesetID"],
        "1141" : ["CS", "FilesetDescriptorFileFileID"],
        "1142" : ["CS", "FilesetDescriptorFileFormat"],
        "1200" : ["UL", "RootDirectoryEntitysFirstDirectoryRecordOffset"],
        "1202" : ["UL", "RootDirectoryEntitysLastDirectoryRecordOffset"],
        "1212" : ["US", "File-setConsistenceFlag"],
        "1220" : ["SQ", "DirectoryRecordSequence"],
        "1400" : ["UL", "NextDirectoryRecordOffset"],
        "1410" : ["US", "RecordInuseFlag"],
        "1420" : ["UL", "ReferencedLowerlevelDirectoryEntityOffset"],
        "1430" : ["CS", "DirectoryRecordType"],
        "1432" : ["UI", "PrivateRecordUID"],
        "1500" : ["CS", "ReferencedFileID"],
        "1510" : ["UI", "ReferencedSOPClassUIDInFile"],
        "1511" : ["UI", "ReferencedSOPInstanceUIDInFile"],
        "1600" : ["UL", "NumberOfReferences"]
    },
    "0008" : {
        "0001" : ["UL", "LengthToEnd"],
        "0005" : ["CS", "SpecificCharacterSet"],
        "0006" : ["SQ", "LanguageCodeSequence"],
        "0008" : ["CS", "ImageType"],
        "0010" : ["SH", "RecognitionCode"],
        "0012" : ["DA", "InstanceCreationDate"],
        "0013" : ["TM", "InstanceCreationTime"],
        "0014" : ["UI", "InstanceCreatorUID"],
        "0016" : ["UI", "SOPClassUID"],
        "0018" : ["UI", "SOPInstanceUID"],
        "001A" : ["UI", "RelatedGeneralSOPClassUID"],
        "001B" : ["UI", "OriginalSpecializedSOPClassUID"],
        "0020" : ["DA", "StudyDate"],
        "0021" : ["DA", "SeriesDate"],
        "0022" : ["DA", "AcquisitionDate"],
        "0023" : ["DA", "ContentDate"],
        "0024" : ["DA", "OverlayDate"],
        "0025" : ["DA", "CurveDate"],
        "002A" : ["DT", "AcquisitionDateTime"],
        "0030" : ["TM", "StudyTime"],
        "0031" : ["TM", "SeriesTime"],
        "0032" : ["TM", "AcquisitionTime"],
        "0033" : ["TM", "ContentTime"],
        "0034" : ["TM", "OverlayTime"],
        "0035" : ["TM", "CurveTime"],
        "0040" : ["US", "DataSetType"],
        "0041" : ["LO", "DataSetSubtype"],
        "0042" : ["CS", "NuclearMedicineSeriesType"],
        "0050" : ["SH", "AccessionNumber"],
        "0051" : ["SQ", "IssuerOfAccessionNumberSequence"],
        "0052" : ["CS", "QueryRetrieveLevel"],
        "0054" : ["AE", "RetrieveAETitle"],
        "0056" : ["CS", "InstanceAvailability"],
        "0058" : ["UI", "FailedSOPInstanceUIDList"],
        "0060" : ["CS", "Modality"],
        "0061" : ["CS", "ModalitiesInStudy"],
        "0062" : ["UI", "SOPClassesInStudy"],
        "0064" : ["CS", "ConversionType"],
        "0068" : ["CS", "PresentationIntentType"],
        "0070" : ["LO", "Manufacturer"],
        "0080" : ["LO", "InstitutionName"],
        "0081" : ["ST", "InstitutionAddress"],
        "0082" : ["SQ", "InstitutionCodeSequence"],
        "0090" : ["PN", "ReferringPhysicianName"],
        "0092" : ["ST", "ReferringPhysicianAddress"],
        "0094" : ["SH", "ReferringPhysicianTelephoneNumbers"],
        "0096" : ["SQ", "ReferringPhysicianIdentificationSequence"],
        "0100" : ["SH", "CodeValue"],
        "0102" : ["SH", "CodingSchemeDesignator"],
        "0103" : ["SH", "CodingSchemeVersion"],
        "0104" : ["LO", "CodeMeaning"],
        "0105" : ["CS", "MappingResource"],
        "0106" : ["DT", "ContextGroupVersion"],
        "0107" : ["DT", "ContextGroupLocalVersion"],
        "010B" : ["CS", "ContextGroupExtensionFlag"],
        "010C" : ["UI", "CodingSchemeUID"],
        "010D" : ["UI", "ContextGroupExtensionCreatorUID"],
        "010F" : ["CS", "ContextIdentifier"],
        "0110" : ["SQ", "CodingSchemeIdentificationSequence"],
        "0112" : ["LO", "CodingSchemeRegistry"],
        "0114" : ["ST", "CodingSchemeExternalID"],
        "0115" : ["ST", "CodingSchemeName"],
        "0116" : ["ST", "CodingSchemeResponsibleOrganization"],
        "0117" : ["UI", "ContextUID"],
        "0201" : ["SH", "TimezoneOffsetFromUTC"],
        "1000" : ["AE", "NetworkID"],
        "1010" : ["SH", "StationName"],
        "1030" : ["LO", "StudyDescription"],
        "1032" : ["SQ", "ProcedureCodeSequence"],
        "103E" : ["LO", "SeriesDescription"],
        "103F" : ["SQ", "SeriesDescriptionCodeSequence"],
        "1040" : ["LO", "InstitutionalDepartmentName"],
        "1048" : ["PN", "PhysiciansOfRecord"],
        "1049" : ["SQ", "PhysiciansOfRecordIdentificationSequence"],
        "1050" : ["PN", "PerformingPhysicianName"],
        "1052" : ["SQ", "PerformingPhysicianIdentificationSequence"],
        "1060" : ["PN", "NameOfPhysiciansReadingStudy"],
        "1062" : ["SQ", "PhysiciansReadingStudyIdentificationSequence"],
        "1070" : ["PN", "OperatorsName"],
        "1072" : ["SQ", "OperatorIdentificationSequence"],
        "1080" : ["LO", "AdmittingDiagnosesDescription"],
        "1084" : ["SQ", "AdmittingDiagnosesCodeSequence"],
        "1090" : ["LO", "ManufacturerModelName"],
        "1100" : ["SQ", "ReferencedResultsSequence"],
        "1110" : ["SQ", "ReferencedStudySequence"],
        "1111" : ["SQ", "ReferencedPerformedProcedureStepSequence"],
        "1115" : ["SQ", "ReferencedSeriesSequence"],
        "1120" : ["SQ", "ReferencedPatientSequence"],
        "1125" : ["SQ", "ReferencedVisitSequence"],
        "1130" : ["SQ", "ReferencedOverlaySequence"],
        "1134" : ["SQ", "ReferencedStereometricInstanceSequence"],
        "113A" : ["SQ", "ReferencedWaveformSequence"],
        "1140" : ["SQ", "ReferencedImageSequence"],
        "1145" : ["SQ", "ReferencedCurveSequence"],
        "114A" : ["SQ", "ReferencedInstanceSequence"],
        "114B" : ["SQ", "ReferencedRealWorldValueMappingInstanceSequence"],
        "1150" : ["UI", "ReferencedSOPClassUID"],
        "1155" : ["UI", "ReferencedSOPInstanceUID"],
        "115A" : ["UI", "SOPClassesSupported"],
        "1160" : ["IS", "ReferencedFrameNumber"],
        "1161" : ["UL", "SimpleFrameList"],
        "1162" : ["UL", "CalculatedFrameList"],
        "1163" : ["FD", "TimeRange"],
        "1164" : ["SQ", "FrameExtractionSequence"],
        "1167" : ["UI", "MultiFrameSourceSOPInstanceUID"],
        "1195" : ["UI", "TransactionUID"],
        "1197" : ["US", "FailureReason"],
        "1198" : ["SQ", "FailedSOPSequence"],
        "1199" : ["SQ", "ReferencedSOPSequence"],
        "1200" : ["SQ", "StudiesContainingOtherReferencedInstancesSequence"],
        "1250" : ["SQ", "RelatedSeriesSequence"],
        "2110" : ["CS", "LossyImageCompressionRetired"],
        "2111" : ["ST", "DerivationDescription"],
        "2112" : ["SQ", "SourceImageSequence"],
        "2120" : ["SH", "StageName"],
        "2122" : ["IS", "StageNumber"],
        "2124" : ["IS", "NumberOfStages"],
        "2127" : ["SH", "ViewName"],
        "2128" : ["IS", "ViewNumber"],
        "2129" : ["IS", "NumberOfEventTimers"],
        "212A" : ["IS", "NumberOfViewsInStage"],
        "2130" : ["DS", "EventElapsedTimes"],
        "2132" : ["LO", "EventTimerNames"],
        "2133" : ["SQ", "EventTimerSequence"],
        "2134" : ["FD", "EventTimeOffset"],
        "2135" : ["SQ", "EventCodeSequence"],
        "2142" : ["IS", "StartTrim"],
        "2143" : ["IS", "StopTrim"],
        "2144" : ["IS", "RecommendedDisplayFrameRate"],
        "2200" : ["CS", "TransducerPosition"],
        "2204" : ["CS", "TransducerOrientation"],
        "2208" : ["CS", "AnatomicStructure"],
        "2218" : ["SQ", "AnatomicRegionSequence"],
        "2220" : ["SQ", "AnatomicRegionModifierSequence"],
        "2228" : ["SQ", "PrimaryAnatomicStructureSequence"],
        "2229" : ["SQ", "AnatomicStructureSpaceOrRegionSequence"],
        "2230" : ["SQ", "PrimaryAnatomicStructureModifierSequence"],
        "2240" : ["SQ", "TransducerPositionSequence"],
        "2242" : ["SQ", "TransducerPositionModifierSequence"],
        "2244" : ["SQ", "TransducerOrientationSequence"],
        "2246" : ["SQ", "TransducerOrientationModifierSequence"],
        "2251" : ["SQ", "AnatomicStructureSpaceOrRegionCodeSequenceTrial"],
        "2253" : ["SQ", "AnatomicPortalOfEntranceCodeSequenceTrial"],
        "2255" : ["SQ", "AnatomicApproachDirectionCodeSequenceTrial"],
        "2256" : ["ST", "AnatomicPerspectiveDescriptionTrial"],
        "2257" : ["SQ", "AnatomicPerspectiveCodeSequenceTrial"],
        "2258" : ["ST", "AnatomicLocationOfExaminingInstrumentDescriptionTrial"],
        "2259" : ["SQ", "AnatomicLocationOfExaminingInstrumentCodeSequenceTrial"],
        "225A" : ["SQ", "AnatomicStructureSpaceOrRegionModifierCodeSequenceTrial"],
        "225C" : ["SQ", "OnAxisBackgroundAnatomicStructureCodeSequenceTrial"],
        "3001" : ["SQ", "AlternateRepresentationSequence"],
        "3010" : ["UI", "IrradiationEventUID"],
        "4000" : ["LT", "IdentifyingComments"],
        "9007" : ["CS", "FrameType"],
        "9092" : ["SQ", "ReferencedImageEvidenceSequence"],
        "9121" : ["SQ", "ReferencedRawDataSequence"],
        "9123" : ["UI", "CreatorVersionUID"],
        "9124" : ["SQ", "DerivationImageSequence"],
        "9154" : ["SQ", "SourceImageEvidenceSequence"],
        "9205" : ["CS", "PixelPresentation"],
        "9206" : ["CS", "VolumetricProperties"],
        "9207" : ["CS", "VolumeBasedCalculationTechnique"],
        "9208" : ["CS", "ComplexImageComponent"],
        "9209" : ["CS", "AcquisitionContrast"],
        "9215" : ["SQ", "DerivationCodeSequence"],
        "9237" : ["SQ", "ReferencedPresentationStateSequence"],
        "9410" : ["SQ", "ReferencedOtherPlaneSequence"],
        "9458" : ["SQ", "FrameDisplaySequence"],
        "9459" : ["FL", "RecommendedDisplayFrameRateInFloat"],
        "9460" : ["CS", "SkipFrameRangeFlag"]
    },
    "0010" : {
        "0010" : ["PN", "PatientName"],
        "0020" : ["LO", "PatientID"],
        "0021" : ["LO", "IssuerOfPatientID"],
        "0022" : ["CS", "TypeOfPatientID"],
        "0024" : ["SQ", "IssuerOfPatientIDQualifiersSequence"],
        "0030" : ["DA", "PatientBirthDate"],
        "0032" : ["TM", "PatientBirthTime"],
        "0040" : ["CS", "PatientSex"],
        "0050" : ["SQ", "PatientInsurancePlanCodeSequence"],
        "0101" : ["SQ", "PatientPrimaryLanguageCodeSequence"],
        "0102" : ["SQ", "PatientPrimaryLanguageModifierCodeSequence"],
        "1000" : ["LO", "OtherPatientIDs"],
        "1001" : ["PN", "OtherPatientNames"],
        "1002" : ["SQ", "OtherPatientIDsSequence"],
        "1005" : ["PN", "PatientBirthName"],
        "1010" : ["AS", "PatientAge"],
        "1020" : ["DS", "PatientSize"],
        "1021" : ["SQ", "PatientSizeCodeSequence"],
        "1030" : ["DS", "PatientWeight"],
        "1040" : ["LO", "PatientAddress"],
        "1050" : ["LO", "InsurancePlanIdentification"],
        "1060" : ["PN", "PatientMotherBirthName"],
        "1080" : ["LO", "MilitaryRank"],
        "1081" : ["LO", "BranchOfService"],
        "1090" : ["LO", "MedicalRecordLocator"],
        "2000" : ["LO", "MedicalAlerts"],
        "2110" : ["LO", "Allergies"],
        "2150" : ["LO", "CountryOfResidence"],
        "2152" : ["LO", "RegionOfResidence"],
        "2154" : ["SH", "PatientTelephoneNumbers"],
        "2160" : ["SH", "EthnicGroup"],
        "2180" : ["SH", "Occupation"],
        "21A0" : ["CS", "SmokingStatus"],
        "21B0" : ["LT", "AdditionalPatientHistory"],
        "21C0" : ["US", "PregnancyStatus"],
        "21D0" : ["DA", "LastMenstrualDate"],
        "21F0" : ["LO", "PatientReligiousPreference"],
        "2201" : ["LO", "PatientSpeciesDescription"],
        "2202" : ["SQ", "PatientSpeciesCodeSequence"],
        "2203" : ["CS", "PatientSexNeutered"],
        "2210" : ["CS", "AnatomicalOrientationType"],
        "2292" : ["LO", "PatientBreedDescription"],
        "2293" : ["SQ", "PatientBreedCodeSequence"],
        "2294" : ["SQ", "BreedRegistrationSequence"],
        "2295" : ["LO", "BreedRegistrationNumber"],
        "2296" : ["SQ", "BreedRegistryCodeSequence"],
        "2297" : ["PN", "ResponsiblePerson"],
        "2298" : ["CS", "ResponsiblePersonRole"],
        "2299" : ["LO", "ResponsibleOrganization"],
        "4000" : ["LT", "PatientComments"],
        "9431" : ["FL", "ExaminedBodyThickness"]
    },
    "0012" : {
        "0010" : ["LO", "ClinicalTrialSponsorName"],
        "0020" : ["LO", "ClinicalTrialProtocolID"],
        "0021" : ["LO", "ClinicalTrialProtocolName"],
        "0030" : ["LO", "ClinicalTrialSiteID"],
        "0031" : ["LO", "ClinicalTrialSiteName"],
        "0040" : ["LO", "ClinicalTrialSubjectID"],
        "0042" : ["LO", "ClinicalTrialSubjectReadingID"],
        "0050" : ["LO", "ClinicalTrialTimePointID"],
        "0051" : ["ST", "ClinicalTrialTimePointDescription"],
        "0060" : ["LO", "ClinicalTrialCoordinatingCenterName"],
        "0062" : ["CS", "PatientIdentityRemoved"],
        "0063" : ["LO", "DeidentificationMethod"],
        "0064" : ["SQ", "DeidentificationMethodCodeSequence"],
        "0071" : ["LO", "ClinicalTrialSeriesID"],
        "0072" : ["LO", "ClinicalTrialSeriesDescription"],
        "0081" : ["LO", "ClinicalTrialProtocolEthicsCommitteeName"],
        "0082" : ["LO", "ClinicalTrialProtocolEthicsCommitteeApprovalNumber"],
        "0083" : ["SQ", "ConsentForClinicalTrialUseSequence"],
        "0084" : ["CS", "DistributionType"],
        "0085" : ["CS", "ConsentForDistributionFlag"]
    },
    "0014" : {
        "0023" : ["ST", "CADFileFormat"],
        "0024" : ["ST", "ComponentReferenceSystem"],
        "0025" : ["ST", "ComponentManufacturingProcedure"],
        "0028" : ["ST", "ComponentManufacturer"],
        "0030" : ["DS", "MaterialThickness"],
        "0032" : ["DS", "MaterialPipeDiameter"],
        "0034" : ["DS", "MaterialIsolationDiameter"],
        "0042" : ["ST", "MaterialGrade"],
        "0044" : ["ST", "MaterialPropertiesFileID"],
        "0045" : ["ST", "MaterialPropertiesFileFormat"],
        "0046" : ["LT", "MaterialNotes"],
        "0050" : ["CS", "ComponentShape"],
        "0052" : ["CS", "CurvatureType"],
        "0054" : ["DS", "OuterDiameter"],
        "0056" : ["DS", "InnerDiameter"],
        "1010" : ["ST", "ActualEnvironmentalConditions"],
        "1020" : ["DA", "ExpiryDate"],
        "1040" : ["ST", "EnvironmentalConditions"],
        "2002" : ["SQ", "EvaluatorSequence"],
        "2004" : ["IS", "EvaluatorNumber"],
        "2006" : ["PN", "EvaluatorName"],
        "2008" : ["IS", "EvaluationAttempt"],
        "2012" : ["SQ", "IndicationSequence"],
        "2014" : ["IS", "IndicationNumber "],
        "2016" : ["SH", "IndicationLabel"],
        "2018" : ["ST", "IndicationDescription"],
        "201A" : ["CS", "IndicationType"],
        "201C" : ["CS", "IndicationDisposition"],
        "201E" : ["SQ", "IndicationROISequence"],
        "2030" : ["SQ", "IndicationPhysicalPropertySequence"],
        "2032" : ["SH", "PropertyLabel"],
        "2202" : ["IS", "CoordinateSystemNumberOfAxes "],
        "2204" : ["SQ", "CoordinateSystemAxesSequence"],
        "2206" : ["ST", "CoordinateSystemAxisDescription"],
        "2208" : ["CS", "CoordinateSystemDataSetMapping"],
        "220A" : ["IS", "CoordinateSystemAxisNumber"],
        "220C" : ["CS", "CoordinateSystemAxisType"],
        "220E" : ["CS", "CoordinateSystemAxisUnits"],
        "2210" : ["OB", "CoordinateSystemAxisValues"],
        "2220" : ["SQ", "CoordinateSystemTransformSequence"],
        "2222" : ["ST", "TransformDescription"],
        "2224" : ["IS", "TransformNumberOfAxes"],
        "2226" : ["IS", "TransformOrderOfAxes"],
        "2228" : ["CS", "TransformedAxisUnits"],
        "222A" : ["DS", "CoordinateSystemTransformRotationAndScaleMatrix"],
        "222C" : ["DS", "CoordinateSystemTransformTranslationMatrix"],
        "3011" : ["DS", "InternalDetectorFrameTime"],
        "3012" : ["DS", "NumberOfFramesIntegrated"],
        "3020" : ["SQ", "DetectorTemperatureSequence"],
        "3022" : ["DS", "SensorName"],
        "3024" : ["DS", "HorizontalOffsetOfSensor"],
        "3026" : ["DS", "VerticalOffsetOfSensor"],
        "3028" : ["DS", "SensorTemperature"],
        "3040" : ["SQ", "DarkCurrentSequence"],
        "3050" : ["OB", "DarkCurrentCounts"],
        "3060" : ["SQ", "GainCorrectionReferenceSequence"],
        "3070" : ["OB", "AirCounts"],
        "3071" : ["DS", "KVUsedInGainCalibration"],
        "3072" : ["DS", "MAUsedInGainCalibration"],
        "3073" : ["DS", "NumberOfFramesUsedForIntegration"],
        "3074" : ["LO", "FilterMaterialUsedInGainCalibration"],
        "3075" : ["DS", "FilterThicknessUsedInGainCalibration"],
        "3076" : ["DA", "DateOfGainCalibration"],
        "3077" : ["TM", "TimeOfGainCalibration"],
        "3080" : ["OB", "BadPixelImage"],
        "3099" : ["LT", "CalibrationNotes"],
        "4002" : ["SQ", "PulserEquipmentSequence"],
        "4004" : ["CS", "PulserType"],
        "4006" : ["LT", "PulserNotes"],
        "4008" : ["SQ", "ReceiverEquipmentSequence"],
        "400A" : ["CS", "AmplifierType"],
        "400C" : ["LT", "ReceiverNotes"],
        "400E" : ["SQ", "PreAmplifierEquipmentSequence"],
        "400F" : ["LT", "PreAmplifierNotes"],
        "4010" : ["SQ", "TransmitTransducerSequence"],
        "4011" : ["SQ", "ReceiveTransducerSequence"],
        "4012" : ["US", "NumberOfElements"],
        "4013" : ["CS", "ElementShape"],
        "4014" : ["DS", "ElementDimensionA"],
        "4015" : ["DS", "ElementDimensionB"],
        "4016" : ["DS", "ElementPitch"],
        "4017" : ["DS", "MeasuredBeamDimensionA"],
        "4018" : ["DS", "MeasuredBeamDimensionB"],
        "4019" : ["DS", "LocationOfMeasuredBeamDiameter"],
        "401A" : ["DS", "NominalFrequency"],
        "401B" : ["DS", "MeasuredCenterFrequency"],
        "401C" : ["DS", "MeasuredBandwidth"],
        "4020" : ["SQ", "PulserSettingsSequence"],
        "4022" : ["DS", "PulseWidth"],
        "4024" : ["DS", "ExcitationFrequency"],
        "4026" : ["CS", "ModulationType"],
        "4028" : ["DS", "Damping"],
        "4030" : ["SQ", "ReceiverSettingsSequence"],
        "4031" : ["DS", "AcquiredSoundpathLength"],
        "4032" : ["CS", "AcquisitionCompressionType"],
        "4033" : ["IS", "AcquisitionSampleSize"],
        "4034" : ["DS", "RectifierSmoothing"],
        "4035" : ["SQ", "DACSequence"],
        "4036" : ["CS", "DACType"],
        "4038" : ["DS", "DACGainPoints"],
        "403A" : ["DS", "DACTimePoints"],
        "403C" : ["DS", "DACAmplitude"],
        "4040" : ["SQ", "PreAmplifierSettingsSequence"],
        "4050" : ["SQ", "TransmitTransducerSettingsSequence"],
        "4051" : ["SQ", "ReceiveTransducerSettingsSequence"],
        "4052" : ["DS", "IncidentAngle"],
        "4054" : ["ST", "CouplingTechnique"],
        "4056" : ["ST", "CouplingMedium"],
        "4057" : ["DS", "CouplingVelocity"],
        "4058" : ["DS", "CrystalCenterLocationX"],
        "4059" : ["DS", "CrystalCenterLocationZ"],
        "405A" : ["DS", "SoundPathLength"],
        "405C" : ["ST", "DelayLawIdentifier"],
        "4060" : ["SQ", "GateSettingsSequence"],
        "4062" : ["DS", "GateThreshold"],
        "4064" : ["DS", "VelocityOfSound"],
        "4070" : ["SQ", "CalibrationSettingsSequence"],
        "4072" : ["ST", "CalibrationProcedure"],
        "4074" : ["SH", "ProcedureVersion"],
        "4076" : ["DA", "ProcedureCreationDate"],
        "4078" : ["DA", "ProcedureExpirationDate"],
        "407A" : ["DA", "ProcedureLastModifiedDate"],
        "407C" : ["TM", "CalibrationTime"],
        "407E" : ["DA", "CalibrationDate"],
        "5002" : ["IS", "LINACEnergy"],
        "5004" : ["IS", "LINACOutput"]
    },
    "0018" : {
        "0010" : ["LO", "ContrastBolusAgent"],
        "0012" : ["SQ", "ContrastBolusAgentSequence"],
        "0014" : ["SQ", "ContrastBolusAdministrationRouteSequence"],
        "0015" : ["CS", "BodyPartExamined"],
        "0020" : ["CS", "ScanningSequence"],
        "0021" : ["CS", "SequenceVariant"],
        "0022" : ["CS", "ScanOptions"],
        "0023" : ["CS", "MRAcquisitionType"],
        "0024" : ["SH", "SequenceName"],
        "0025" : ["CS", "AngioFlag"],
        "0026" : ["SQ", "InterventionDrugInformationSequence"],
        "0027" : ["TM", "InterventionDrugStopTime"],
        "0028" : ["DS", "InterventionDrugDose"],
        "0029" : ["SQ", "InterventionDrugCodeSequence"],
        "002A" : ["SQ", "AdditionalDrugSequence"],
        "0030" : ["LO", "Radionuclide"],
        "0031" : ["LO", "Radiopharmaceutical"],
        "0032" : ["DS", "EnergyWindowCenterline"],
        "0033" : ["DS", "EnergyWindowTotalWidth"],
        "0034" : ["LO", "InterventionDrugName"],
        "0035" : ["TM", "InterventionDrugStartTime"],
        "0036" : ["SQ", "InterventionSequence"],
        "0037" : ["CS", "TherapyType"],
        "0038" : ["CS", "InterventionStatus"],
        "0039" : ["CS", "TherapyDescription"],
        "003A" : ["ST", "InterventionDescription"],
        "0040" : ["IS", "CineRate"],
        "0042" : ["CS", "InitialCineRunState"],
        "0050" : ["DS", "SliceThickness"],
        "0060" : ["DS", "KVP"],
        "0070" : ["IS", "CountsAccumulated"],
        "0071" : ["CS", "AcquisitionTerminationCondition"],
        "0072" : ["DS", "EffectiveDuration"],
        "0073" : ["CS", "AcquisitionStartCondition"],
        "0074" : ["IS", "AcquisitionStartConditionData"],
        "0075" : ["IS", "AcquisitionTerminationConditionData"],
        "0080" : ["DS", "RepetitionTime"],
        "0081" : ["DS", "EchoTime"],
        "0082" : ["DS", "InversionTime"],
        "0083" : ["DS", "NumberOfAverages"],
        "0084" : ["DS", "ImagingFrequency"],
        "0085" : ["SH", "ImagedNucleus"],
        "0086" : ["IS", "EchoNumbers"],
        "0087" : ["DS", "MagneticFieldStrength"],
        "0088" : ["DS", "SpacingBetweenSlices"],
        "0089" : ["IS", "NumberOfPhaseEncodingSteps"],
        "0090" : ["DS", "DataCollectionDiameter"],
        "0091" : ["IS", "EchoTrainLength"],
        "0093" : ["DS", "PercentSampling"],
        "0094" : ["DS", "PercentPhaseFieldOfView"],
        "0095" : ["DS", "PixelBandwidth"],
        "1000" : ["LO", "DeviceSerialNumber"],
        "1002" : ["UI", "DeviceUID"],
        "1003" : ["LO", "DeviceID"],
        "1004" : ["LO", "PlateID"],
        "1005" : ["LO", "GeneratorID"],
        "1006" : ["LO", "GridID"],
        "1007" : ["LO", "CassetteID"],
        "1008" : ["LO", "GantryID"],
        "1010" : ["LO", "SecondaryCaptureDeviceID"],
        "1011" : ["LO", "HardcopyCreationDeviceID"],
        "1012" : ["DA", "DateOfSecondaryCapture"],
        "1014" : ["TM", "TimeOfSecondaryCapture"],
        "1016" : ["LO", "SecondaryCaptureDeviceManufacturer"],
        "1017" : ["LO", "HardcopyDeviceManufacturer"],
        "1018" : ["LO", "SecondaryCaptureDeviceManufacturerModelName"],
        "1019" : ["LO", "SecondaryCaptureDeviceSoftwareVersions"],
        "101A" : ["LO", "HardcopyDeviceSoftwareVersion"],
        "101B" : ["LO", "HardcopyDeviceManufacturerModelName"],
        "1020" : ["LO", "SoftwareVersions"],
        "1022" : ["SH", "VideoImageFormatAcquired"],
        "1023" : ["LO", "DigitalImageFormatAcquired"],
        "1030" : ["LO", "ProtocolName"],
        "1040" : ["LO", "ContrastBolusRoute"],
        "1041" : ["DS", "ContrastBolusVolume"],
        "1042" : ["TM", "ContrastBolusStartTime"],
        "1043" : ["TM", "ContrastBolusStopTime"],
        "1044" : ["DS", "ContrastBolusTotalDose"],
        "1045" : ["IS", "SyringeCounts"],
        "1046" : ["DS", "ContrastFlowRate"],
        "1047" : ["DS", "ContrastFlowDuration"],
        "1048" : ["CS", "ContrastBolusIngredient"],
        "1049" : ["DS", "ContrastBolusIngredientConcentration"],
        "1050" : ["DS", "SpatialResolution"],
        "1060" : ["DS", "TriggerTime"],
        "1061" : ["LO", "TriggerSourceOrType"],
        "1062" : ["IS", "NominalInterval"],
        "1063" : ["DS", "FrameTime"],
        "1064" : ["LO", "CardiacFramingType"],
        "1065" : ["DS", "FrameTimeVector"],
        "1066" : ["DS", "FrameDelay"],
        "1067" : ["DS", "ImageTriggerDelay"],
        "1068" : ["DS", "MultiplexGroupTimeOffset"],
        "1069" : ["DS", "TriggerTimeOffset"],
        "106A" : ["CS", "SynchronizationTrigger"],
        "106C" : ["US", "SynchronizationChannel"],
        "106E" : ["UL", "TriggerSamplePosition"],
        "1070" : ["LO", "RadiopharmaceuticalRoute"],
        "1071" : ["DS", "RadiopharmaceuticalVolume"],
        "1072" : ["TM", "RadiopharmaceuticalStartTime"],
        "1073" : ["TM", "RadiopharmaceuticalStopTime"],
        "1074" : ["DS", "RadionuclideTotalDose"],
        "1075" : ["DS", "RadionuclideHalfLife"],
        "1076" : ["DS", "RadionuclidePositronFraction"],
        "1077" : ["DS", "RadiopharmaceuticalSpecificActivity"],
        "1078" : ["DT", "RadiopharmaceuticalStartDateTime"],
        "1079" : ["DT", "RadiopharmaceuticalStopDateTime"],
        "1080" : ["CS", "BeatRejectionFlag"],
        "1081" : ["IS", "LowRRValue"],
        "1082" : ["IS", "HighRRValue"],
        "1083" : ["IS", "IntervalsAcquired"],
        "1084" : ["IS", "IntervalsRejected"],
        "1085" : ["LO", "PVCRejection"],
        "1086" : ["IS", "SkipBeats"],
        "1088" : ["IS", "HeartRate"],
        "1090" : ["IS", "CardiacNumberOfImages"],
        "1094" : ["IS", "TriggerWindow"],
        "1100" : ["DS", "ReconstructionDiameter"],
        "1110" : ["DS", "DistanceSourceToDetector"],
        "1111" : ["DS", "DistanceSourceToPatient"],
        "1114" : ["DS", "EstimatedRadiographicMagnificationFactor"],
        "1120" : ["DS", "GantryDetectorTilt"],
        "1121" : ["DS", "GantryDetectorSlew"],
        "1130" : ["DS", "TableHeight"],
        "1131" : ["DS", "TableTraverse"],
        "1134" : ["CS", "TableMotion"],
        "1135" : ["DS", "TableVerticalIncrement"],
        "1136" : ["DS", "TableLateralIncrement"],
        "1137" : ["DS", "TableLongitudinalIncrement"],
        "1138" : ["DS", "TableAngle"],
        "113A" : ["CS", "TableType"],
        "1140" : ["CS", "RotationDirection"],
        "1141" : ["DS", "AngularPosition"],
        "1142" : ["DS", "RadialPosition"],
        "1143" : ["DS", "ScanArc"],
        "1144" : ["DS", "AngularStep"],
        "1145" : ["DS", "CenterOfRotationOffset"],
        "1146" : ["DS", "RotationOffset"],
        "1147" : ["CS", "FieldOfViewShape"],
        "1149" : ["IS", "FieldOfViewDimensions"],
        "1150" : ["IS", "ExposureTime"],
        "1151" : ["IS", "XRayTubeCurrent"],
        "1152" : ["IS", "Exposure"],
        "1153" : ["IS", "ExposureInuAs"],
        "1154" : ["DS", "AveragePulseWidth"],
        "1155" : ["CS", "RadiationSetting"],
        "1156" : ["CS", "RectificationType"],
        "115A" : ["CS", "RadiationMode"],
        "115E" : ["DS", "ImageAndFluoroscopyAreaDoseProduct"],
        "1160" : ["SH", "FilterType"],
        "1161" : ["LO", "TypeOfFilters"],
        "1162" : ["DS", "IntensifierSize"],
        "1164" : ["DS", "ImagerPixelSpacing"],
        "1166" : ["CS", "Grid"],
        "1170" : ["IS", "GeneratorPower"],
        "1180" : ["SH", "CollimatorGridName"],
        "1181" : ["CS", "CollimatorType"],
        "1182" : ["IS", "FocalDistance"],
        "1183" : ["DS", "XFocusCenter"],
        "1184" : ["DS", "YFocusCenter"],
        "1190" : ["DS", "FocalSpots"],
        "1191" : ["CS", "AnodeTargetMaterial"],
        "11A0" : ["DS", "BodyPartThickness"],
        "11A2" : ["DS", "CompressionForce"],
        "1200" : ["DA", "DateOfLastCalibration"],
        "1201" : ["TM", "TimeOfLastCalibration"],
        "1210" : ["SH", "ConvolutionKernel"],
        "1240" : ["IS", "UpperLowerPixelValues"],
        "1242" : ["IS", "ActualFrameDuration"],
        "1243" : ["IS", "CountRate"],
        "1244" : ["US", "PreferredPlaybackSequencing"],
        "1250" : ["SH", "ReceiveCoilName"],
        "1251" : ["SH", "TransmitCoilName"],
        "1260" : ["SH", "PlateType"],
        "1261" : ["LO", "PhosphorType"],
        "1300" : ["DS", "ScanVelocity"],
        "1301" : ["CS", "WholeBodyTechnique"],
        "1302" : ["IS", "ScanLength"],
        "1310" : ["US", "AcquisitionMatrix"],
        "1312" : ["CS", "InPlanePhaseEncodingDirection"],
        "1314" : ["DS", "FlipAngle"],
        "1315" : ["CS", "VariableFlipAngleFlag"],
        "1316" : ["DS", "SAR"],
        "1318" : ["DS", "dBdt"],
        "1400" : ["LO", "AcquisitionDeviceProcessingDescription"],
        "1401" : ["LO", "AcquisitionDeviceProcessingCode"],
        "1402" : ["CS", "CassetteOrientation"],
        "1403" : ["CS", "CassetteSize"],
        "1404" : ["US", "ExposuresOnPlate"],
        "1405" : ["IS", "RelativeXRayExposure"],
        "1411" : ["DS", "ExposureIndex"],
        "1412" : ["DS", "TargetExposureIndex"],
        "1413" : ["DS", "DeviationIndex"],
        "1450" : ["DS", "ColumnAngulation"],
        "1460" : ["DS", "TomoLayerHeight"],
        "1470" : ["DS", "TomoAngle"],
        "1480" : ["DS", "TomoTime"],
        "1490" : ["CS", "TomoType"],
        "1491" : ["CS", "TomoClass"],
        "1495" : ["IS", "NumberOfTomosynthesisSourceImages"],
        "1500" : ["CS", "PositionerMotion"],
        "1508" : ["CS", "PositionerType"],
        "1510" : ["DS", "PositionerPrimaryAngle"],
        "1511" : ["DS", "PositionerSecondaryAngle"],
        "1520" : ["DS", "PositionerPrimaryAngleIncrement"],
        "1521" : ["DS", "PositionerSecondaryAngleIncrement"],
        "1530" : ["DS", "DetectorPrimaryAngle"],
        "1531" : ["DS", "DetectorSecondaryAngle"],
        "1600" : ["CS", "ShutterShape"],
        "1602" : ["IS", "ShutterLeftVerticalEdge"],
        "1604" : ["IS", "ShutterRightVerticalEdge"],
        "1606" : ["IS", "ShutterUpperHorizontalEdge"],
        "1608" : ["IS", "ShutterLowerHorizontalEdge"],
        "1610" : ["IS", "CenterOfCircularShutter"],
        "1612" : ["IS", "RadiusOfCircularShutter"],
        "1620" : ["IS", "VerticesOfThePolygonalShutter"],
        "1622" : ["US", "ShutterPresentationValue"],
        "1623" : ["US", "ShutterOverlayGroup"],
        "1624" : ["US", "ShutterPresentationColorCIELabValue"],
        "1700" : ["CS", "CollimatorShape"],
        "1702" : ["IS", "CollimatorLeftVerticalEdge"],
        "1704" : ["IS", "CollimatorRightVerticalEdge"],
        "1706" : ["IS", "CollimatorUpperHorizontalEdge"],
        "1708" : ["IS", "CollimatorLowerHorizontalEdge"],
        "1710" : ["IS", "CenterOfCircularCollimator"],
        "1712" : ["IS", "RadiusOfCircularCollimator"],
        "1720" : ["IS", "VerticesOfThePolygonalCollimator"],
        "1800" : ["CS", "AcquisitionTimeSynchronized"],
        "1801" : ["SH", "TimeSource"],
        "1802" : ["CS", "TimeDistributionProtocol"],
        "1803" : ["LO", "NTPSourceAddress"],
        "2001" : ["IS", "PageNumberVector"],
        "2002" : ["SH", "FrameLabelVector"],
        "2003" : ["DS", "FramePrimaryAngleVector"],
        "2004" : ["DS", "FrameSecondaryAngleVector"],
        "2005" : ["DS", "SliceLocationVector"],
        "2006" : ["SH", "DisplayWindowLabelVector"],
        "2010" : ["DS", "NominalScannedPixelSpacing"],
        "2020" : ["CS", "DigitizingDeviceTransportDirection"],
        "2030" : ["DS", "RotationOfScannedFilm"],
        "3100" : ["CS", "IVUSAcquisition"],
        "3101" : ["DS", "IVUSPullbackRate"],
        "3102" : ["DS", "IVUSGatedRate"],
        "3103" : ["IS", "IVUSPullbackStartFrameNumber"],
        "3104" : ["IS", "IVUSPullbackStopFrameNumber"],
        "3105" : ["IS", "LesionNumber"],
        "4000" : ["LT", "AcquisitionComments"],
        "5000" : ["SH", "OutputPower"],
        "5010" : ["LO", "TransducerData"],
        "5012" : ["DS", "FocusDepth"],
        "5020" : ["LO", "ProcessingFunction"],
        "5021" : ["LO", "PostprocessingFunction"],
        "5022" : ["DS", "MechanicalIndex"],
        "5024" : ["DS", "BoneThermalIndex"],
        "5026" : ["DS", "CranialThermalIndex"],
        "5027" : ["DS", "SoftTissueThermalIndex"],
        "5028" : ["DS", "SoftTissueFocusThermalIndex"],
        "5029" : ["DS", "SoftTissueSurfaceThermalIndex"],
        "5030" : ["DS", "DynamicRange"],
        "5040" : ["DS", "TotalGain"],
        "5050" : ["IS", "DepthOfScanField"],
        "5100" : ["CS", "PatientPosition"],
        "5101" : ["CS", "ViewPosition"],
        "5104" : ["SQ", "ProjectionEponymousNameCodeSequence"],
        "5210" : ["DS", "ImageTransformationMatrix"],
        "5212" : ["DS", "ImageTranslationVector"],
        "6000" : ["DS", "Sensitivity"],
        "6011" : ["SQ", "SequenceOfUltrasoundRegions"],
        "6012" : ["US", "RegionSpatialFormat"],
        "6014" : ["US", "RegionDataType"],
        "6016" : ["UL", "RegionFlags"],
        "6018" : ["UL", "RegionLocationMinX0"],
        "601A" : ["UL", "RegionLocationMinY0"],
        "601C" : ["UL", "RegionLocationMaxX1"],
        "601E" : ["UL", "RegionLocationMaxY1"],
        "6020" : ["SL", "ReferencePixelX0"],
        "6022" : ["SL", "ReferencePixelY0"],
        "6024" : ["US", "PhysicalUnitsXDirection"],
        "6026" : ["US", "PhysicalUnitsYDirection"],
        "6028" : ["FD", "ReferencePixelPhysicalValueX"],
        "602A" : ["FD", "ReferencePixelPhysicalValueY"],
        "602C" : ["FD", "PhysicalDeltaX"],
        "602E" : ["FD", "PhysicalDeltaY"],
        "6030" : ["UL", "TransducerFrequency"],
        "6031" : ["CS", "TransducerType"],
        "6032" : ["UL", "PulseRepetitionFrequency"],
        "6034" : ["FD", "DopplerCorrectionAngle"],
        "6036" : ["FD", "SteeringAngle"],
        "6038" : ["UL", "DopplerSampleVolumeXPositionRetired"],
        "6039" : ["SL", "DopplerSampleVolumeXPosition"],
        "603A" : ["UL", "DopplerSampleVolumeYPositionRetired"],
        "603B" : ["SL", "DopplerSampleVolumeYPosition"],
        "603C" : ["UL", "TMLinePositionX0Retired"],
        "603D" : ["SL", "TMLinePositionX0"],
        "603E" : ["UL", "TMLinePositionY0Retired"],
        "603F" : ["SL", "TMLinePositionY0"],
        "6040" : ["UL", "TMLinePositionX1Retired"],
        "6041" : ["SL", "TMLinePositionX1"],
        "6042" : ["UL", "TMLinePositionY1Retired"],
        "6043" : ["SL", "TMLinePositionY1"],
        "6044" : ["US", "PixelComponentOrganization"],
        "6046" : ["UL", "PixelComponentMask"],
        "6048" : ["UL", "PixelComponentRangeStart"],
        "604A" : ["UL", "PixelComponentRangeStop"],
        "604C" : ["US", "PixelComponentPhysicalUnits"],
        "604E" : ["US", "PixelComponentDataType"],
        "6050" : ["UL", "NumberOfTableBreakPoints"],
        "6052" : ["UL", "TableOfXBreakPoints"],
        "6054" : ["FD", "TableOfYBreakPoints"],
        "6056" : ["UL", "NumberOfTableEntries"],
        "6058" : ["UL", "TableOfPixelValues"],
        "605A" : ["FL", "TableOfParameterValues"],
        "6060" : ["FL", "RWaveTimeVector"],
        "7000" : ["CS", "DetectorConditionsNominalFlag"],
        "7001" : ["DS", "DetectorTemperature"],
        "7004" : ["CS", "DetectorType"],
        "7005" : ["CS", "DetectorConfiguration"],
        "7006" : ["LT", "DetectorDescription"],
        "7008" : ["LT", "DetectorMode"],
        "700A" : ["SH", "DetectorID"],
        "700C" : ["DA", "DateOfLastDetectorCalibration"],
        "700E" : ["TM", "TimeOfLastDetectorCalibration"],
        "7010" : ["IS", "ExposuresOnDetectorSinceLastCalibration"],
        "7011" : ["IS", "ExposuresOnDetectorSinceManufactured"],
        "7012" : ["DS", "DetectorTimeSinceLastExposure"],
        "7014" : ["DS", "DetectorActiveTime"],
        "7016" : ["DS", "DetectorActivationOffsetFromExposure"],
        "701A" : ["DS", "DetectorBinning"],
        "7020" : ["DS", "DetectorElementPhysicalSize"],
        "7022" : ["DS", "DetectorElementSpacing"],
        "7024" : ["CS", "DetectorActiveShape"],
        "7026" : ["DS", "DetectorActiveDimensions"],
        "7028" : ["DS", "DetectorActiveOrigin"],
        "702A" : ["LO", "DetectorManufacturerName"],
        "702B" : ["LO", "DetectorManufacturerModelName"],
        "7030" : ["DS", "FieldOfViewOrigin"],
        "7032" : ["DS", "FieldOfViewRotation"],
        "7034" : ["CS", "FieldOfViewHorizontalFlip"],
        "7036" : ["FL", "PixelDataAreaOriginRelativeToFOV"],
        "7038" : ["FL", "PixelDataAreaRotationAngleRelativeToFOV"],
        "7040" : ["LT", "GridAbsorbingMaterial"],
        "7041" : ["LT", "GridSpacingMaterial"],
        "7042" : ["DS", "GridThickness"],
        "7044" : ["DS", "GridPitch"],
        "7046" : ["IS", "GridAspectRatio"],
        "7048" : ["DS", "GridPeriod"],
        "704C" : ["DS", "GridFocalDistance"],
        "7050" : ["CS", "FilterMaterial"],
        "7052" : ["DS", "FilterThicknessMinimum"],
        "7054" : ["DS", "FilterThicknessMaximum"],
        "7056" : ["FL", "FilterBeamPathLengthMinimum"],
        "7058" : ["FL", "FilterBeamPathLengthMaximum"],
        "7060" : ["CS", "ExposureControlMode"],
        "7062" : ["LT", "ExposureControlModeDescription"],
        "7064" : ["CS", "ExposureStatus"],
        "7065" : ["DS", "PhototimerSetting"],
        "8150" : ["DS", "ExposureTimeInuS"],
        "8151" : ["DS", "XRayTubeCurrentInuA"],
        "9004" : ["CS", "ContentQualification"],
        "9005" : ["SH", "PulseSequenceName"],
        "9006" : ["SQ", "MRImagingModifierSequence"],
        "9008" : ["CS", "EchoPulseSequence"],
        "9009" : ["CS", "InversionRecovery"],
        "9010" : ["CS", "FlowCompensation"],
        "9011" : ["CS", "MultipleSpinEcho"],
        "9012" : ["CS", "MultiPlanarExcitation"],
        "9014" : ["CS", "PhaseContrast"],
        "9015" : ["CS", "TimeOfFlightContrast"],
        "9016" : ["CS", "Spoiling"],
        "9017" : ["CS", "SteadyStatePulseSequence"],
        "9018" : ["CS", "EchoPlanarPulseSequence"],
        "9019" : ["FD", "TagAngleFirstAxis"],
        "9020" : ["CS", "MagnetizationTransfer"],
        "9021" : ["CS", "T2Preparation"],
        "9022" : ["CS", "BloodSignalNulling"],
        "9024" : ["CS", "SaturationRecovery"],
        "9025" : ["CS", "SpectrallySelectedSuppression"],
        "9026" : ["CS", "SpectrallySelectedExcitation"],
        "9027" : ["CS", "SpatialPresaturation"],
        "9028" : ["CS", "Tagging"],
        "9029" : ["CS", "OversamplingPhase"],
        "9030" : ["FD", "TagSpacingFirstDimension"],
        "9032" : ["CS", "GeometryOfKSpaceTraversal"],
        "9033" : ["CS", "SegmentedKSpaceTraversal"],
        "9034" : ["CS", "RectilinearPhaseEncodeReordering"],
        "9035" : ["FD", "TagThickness"],
        "9036" : ["CS", "PartialFourierDirection"],
        "9037" : ["CS", "CardiacSynchronizationTechnique"],
        "9041" : ["LO", "ReceiveCoilManufacturerName"],
        "9042" : ["SQ", "MRReceiveCoilSequence"],
        "9043" : ["CS", "ReceiveCoilType"],
        "9044" : ["CS", "QuadratureReceiveCoil"],
        "9045" : ["SQ", "MultiCoilDefinitionSequence"],
        "9046" : ["LO", "MultiCoilConfiguration"],
        "9047" : ["SH", "MultiCoilElementName"],
        "9048" : ["CS", "MultiCoilElementUsed"],
        "9049" : ["SQ", "MRTransmitCoilSequence"],
        "9050" : ["LO", "TransmitCoilManufacturerName"],
        "9051" : ["CS", "TransmitCoilType"],
        "9052" : ["FD", "SpectralWidth"],
        "9053" : ["FD", "ChemicalShiftReference"],
        "9054" : ["CS", "VolumeLocalizationTechnique"],
        "9058" : ["US", "MRAcquisitionFrequencyEncodingSteps"],
        "9059" : ["CS", "Decoupling"],
        "9060" : ["CS", "DecoupledNucleus"],
        "9061" : ["FD", "DecouplingFrequency"],
        "9062" : ["CS", "DecouplingMethod"],
        "9063" : ["FD", "DecouplingChemicalShiftReference"],
        "9064" : ["CS", "KSpaceFiltering"],
        "9065" : ["CS", "TimeDomainFiltering"],
        "9066" : ["US", "NumberOfZeroFills"],
        "9067" : ["CS", "BaselineCorrection"],
        "9069" : ["FD", "ParallelReductionFactorInPlane"],
        "9070" : ["FD", "CardiacRRIntervalSpecified"],
        "9073" : ["FD", "AcquisitionDuration"],
        "9074" : ["DT", "FrameAcquisitionDateTime"],
        "9075" : ["CS", "DiffusionDirectionality"],
        "9076" : ["SQ", "DiffusionGradientDirectionSequence"],
        "9077" : ["CS", "ParallelAcquisition"],
        "9078" : ["CS", "ParallelAcquisitionTechnique"],
        "9079" : ["FD", "InversionTimes"],
        "9080" : ["ST", "MetaboliteMapDescription"],
        "9081" : ["CS", "PartialFourier"],
        "9082" : ["FD", "EffectiveEchoTime"],
        "9083" : ["SQ", "MetaboliteMapCodeSequence"],
        "9084" : ["SQ", "ChemicalShiftSequence"],
        "9085" : ["CS", "CardiacSignalSource"],
        "9087" : ["FD", "DiffusionBValue"],
        "9089" : ["FD", "DiffusionGradientOrientation"],
        "9090" : ["FD", "VelocityEncodingDirection"],
        "9091" : ["FD", "VelocityEncodingMinimumValue"],
        "9092" : ["SQ", "VelocityEncodingAcquisitionSequence"],
        "9093" : ["US", "NumberOfKSpaceTrajectories"],
        "9094" : ["CS", "CoverageOfKSpace"],
        "9095" : ["UL", "SpectroscopyAcquisitionPhaseRows"],
        "9096" : ["FD", "ParallelReductionFactorInPlaneRetired"],
        "9098" : ["FD", "TransmitterFrequency"],
        "9100" : ["CS", "ResonantNucleus"],
        "9101" : ["CS", "FrequencyCorrection"],
        "9103" : ["SQ", "MRSpectroscopyFOVGeometrySequence"],
        "9104" : ["FD", "SlabThickness"],
        "9105" : ["FD", "SlabOrientation"],
        "9106" : ["FD", "MidSlabPosition"],
        "9107" : ["SQ", "MRSpatialSaturationSequence"],
        "9112" : ["SQ", "MRTimingAndRelatedParametersSequence"],
        "9114" : ["SQ", "MREchoSequence"],
        "9115" : ["SQ", "MRModifierSequence"],
        "9117" : ["SQ", "MRDiffusionSequence"],
        "9118" : ["SQ", "CardiacSynchronizationSequence"],
        "9119" : ["SQ", "MRAveragesSequence"],
        "9125" : ["SQ", "MRFOVGeometrySequence"],
        "9126" : ["SQ", "VolumeLocalizationSequence"],
        "9127" : ["UL", "SpectroscopyAcquisitionDataColumns"],
        "9147" : ["CS", "DiffusionAnisotropyType"],
        "9151" : ["DT", "FrameReferenceDateTime"],
        "9152" : ["SQ", "MRMetaboliteMapSequence"],
        "9155" : ["FD", "ParallelReductionFactorOutOfPlane"],
        "9159" : ["UL", "SpectroscopyAcquisitionOutOfPlanePhaseSteps"],
        "9166" : ["CS", "BulkMotionStatus"],
        "9168" : ["FD", "ParallelReductionFactorSecondInPlane"],
        "9169" : ["CS", "CardiacBeatRejectionTechnique"],
        "9170" : ["CS", "RespiratoryMotionCompensationTechnique"],
        "9171" : ["CS", "RespiratorySignalSource"],
        "9172" : ["CS", "BulkMotionCompensationTechnique"],
        "9173" : ["CS", "BulkMotionSignalSource"],
        "9174" : ["CS", "ApplicableSafetyStandardAgency"],
        "9175" : ["LO", "ApplicableSafetyStandardDescription"],
        "9176" : ["SQ", "OperatingModeSequence"],
        "9177" : ["CS", "OperatingModeType"],
        "9178" : ["CS", "OperatingMode"],
        "9179" : ["CS", "SpecificAbsorptionRateDefinition"],
        "9180" : ["CS", "GradientOutputType"],
        "9181" : ["FD", "SpecificAbsorptionRateValue"],
        "9182" : ["FD", "GradientOutput"],
        "9183" : ["CS", "FlowCompensationDirection"],
        "9184" : ["FD", "TaggingDelay"],
        "9185" : ["ST", "RespiratoryMotionCompensationTechniqueDescription"],
        "9186" : ["SH", "RespiratorySignalSourceID"],
        "9195" : ["FD", "ChemicalShiftMinimumIntegrationLimitInHz"],
        "9196" : ["FD", "ChemicalShiftMaximumIntegrationLimitInHz"],
        "9197" : ["SQ", "MRVelocityEncodingSequence"],
        "9198" : ["CS", "FirstOrderPhaseCorrection"],
        "9199" : ["CS", "WaterReferencedPhaseCorrection"],
        "9200" : ["CS", "MRSpectroscopyAcquisitionType"],
        "9214" : ["CS", "RespiratoryCyclePosition"],
        "9217" : ["FD", "VelocityEncodingMaximumValue"],
        "9218" : ["FD", "TagSpacingSecondDimension"],
        "9219" : ["SS", "TagAngleSecondAxis"],
        "9220" : ["FD", "FrameAcquisitionDuration"],
        "9226" : ["SQ", "MRImageFrameTypeSequence"],
        "9227" : ["SQ", "MRSpectroscopyFrameTypeSequence"],
        "9231" : ["US", "MRAcquisitionPhaseEncodingStepsInPlane"],
        "9232" : ["US", "MRAcquisitionPhaseEncodingStepsOutOfPlane"],
        "9234" : ["UL", "SpectroscopyAcquisitionPhaseColumns"],
        "9236" : ["CS", "CardiacCyclePosition"],
        "9239" : ["SQ", "SpecificAbsorptionRateSequence"],
        "9240" : ["US", "RFEchoTrainLength"],
        "9241" : ["US", "GradientEchoTrainLength"],
        "9250" : ["CS", "ArterialSpinLabelingContrast"],
        "9251" : ["SQ", "MRArterialSpinLabelingSequence"],
        "9252" : ["LO", "ASLTechniqueDescription"],
        "9253" : ["US", "ASLSlabNumber"],
        "9254" : ["FD ", "ASLSlabThickness"],
        "9255" : ["FD ", "ASLSlabOrientation"],
        "9256" : ["FD ", "ASLMidSlabPosition"],
        "9257" : ["CS", "ASLContext"],
        "9258" : ["UL", "ASLPulseTrainDuration"],
        "9259" : ["CS", "ASLCrusherFlag"],
        "925A" : ["FD", "ASLCrusherFlow"],
        "925B" : ["LO", "ASLCrusherDescription"],
        "925C" : ["CS", "ASLBolusCutoffFlag"],
        "925D" : ["SQ", "ASLBolusCutoffTimingSequence"],
        "925E" : ["LO", "ASLBolusCutoffTechnique"],
        "925F" : ["UL", "ASLBolusCutoffDelayTime"],
        "9260" : ["SQ", "ASLSlabSequence"],
        "9295" : ["FD", "ChemicalShiftMinimumIntegrationLimitInppm"],
        "9296" : ["FD", "ChemicalShiftMaximumIntegrationLimitInppm"],
        "9301" : ["SQ", "CTAcquisitionTypeSequence"],
        "9302" : ["CS", "AcquisitionType"],
        "9303" : ["FD", "TubeAngle"],
        "9304" : ["SQ", "CTAcquisitionDetailsSequence"],
        "9305" : ["FD", "RevolutionTime"],
        "9306" : ["FD", "SingleCollimationWidth"],
        "9307" : ["FD", "TotalCollimationWidth"],
        "9308" : ["SQ", "CTTableDynamicsSequence"],
        "9309" : ["FD", "TableSpeed"],
        "9310" : ["FD", "TableFeedPerRotation"],
        "9311" : ["FD", "SpiralPitchFactor"],
        "9312" : ["SQ", "CTGeometrySequence"],
        "9313" : ["FD", "DataCollectionCenterPatient"],
        "9314" : ["SQ", "CTReconstructionSequence"],
        "9315" : ["CS", "ReconstructionAlgorithm"],
        "9316" : ["CS", "ConvolutionKernelGroup"],
        "9317" : ["FD", "ReconstructionFieldOfView"],
        "9318" : ["FD", "ReconstructionTargetCenterPatient"],
        "9319" : ["FD", "ReconstructionAngle"],
        "9320" : ["SH", "ImageFilter"],
        "9321" : ["SQ", "CTExposureSequence"],
        "9322" : ["FD", "ReconstructionPixelSpacing"],
        "9323" : ["CS", "ExposureModulationType"],
        "9324" : ["FD", "EstimatedDoseSaving"],
        "9325" : ["SQ", "CTXRayDetailsSequence"],
        "9326" : ["SQ", "CTPositionSequence"],
        "9327" : ["FD", "TablePosition"],
        "9328" : ["FD", "ExposureTimeInms"],
        "9329" : ["SQ", "CTImageFrameTypeSequence"],
        "9330" : ["FD", "XRayTubeCurrentInmA"],
        "9332" : ["FD", "ExposureInmAs"],
        "9333" : ["CS", "ConstantVolumeFlag"],
        "9334" : ["CS", "FluoroscopyFlag"],
        "9335" : ["FD", "DistanceSourceToDataCollectionCenter"],
        "9337" : ["US", "ContrastBolusAgentNumber"],
        "9338" : ["SQ", "ContrastBolusIngredientCodeSequence"],
        "9340" : ["SQ", "ContrastAdministrationProfileSequence"],
        "9341" : ["SQ", "ContrastBolusUsageSequence"],
        "9342" : ["CS", "ContrastBolusAgentAdministered"],
        "9343" : ["CS", "ContrastBolusAgentDetected"],
        "9344" : ["CS", "ContrastBolusAgentPhase"],
        "9345" : ["FD", "CTDIvol"],
        "9346" : ["SQ", "CTDIPhantomTypeCodeSequence"],
        "9351" : ["FL", "CalciumScoringMassFactorPatient"],
        "9352" : ["FL", "CalciumScoringMassFactorDevice"],
        "9353" : ["FL", "EnergyWeightingFactor"],
        "9360" : ["SQ", "CTAdditionalXRaySourceSequence"],
        "9401" : ["SQ", "ProjectionPixelCalibrationSequence"],
        "9402" : ["FL", "DistanceSourceToIsocenter"],
        "9403" : ["FL", "DistanceObjectToTableTop"],
        "9404" : ["FL", "ObjectPixelSpacingInCenterOfBeam"],
        "9405" : ["SQ", "PositionerPositionSequence"],
        "9406" : ["SQ", "TablePositionSequence"],
        "9407" : ["SQ", "CollimatorShapeSequence"],
        "9410" : ["CS", "PlanesInAcquisition"],
        "9412" : ["SQ", "XAXRFFrameCharacteristicsSequence"],
        "9417" : ["SQ", "FrameAcquisitionSequence"],
        "9420" : ["CS", "XRayReceptorType"],
        "9423" : ["LO", "AcquisitionProtocolName"],
        "9424" : ["LT", "AcquisitionProtocolDescription"],
        "9425" : ["CS", "ContrastBolusIngredientOpaque"],
        "9426" : ["FL", "DistanceReceptorPlaneToDetectorHousing"],
        "9427" : ["CS", "IntensifierActiveShape"],
        "9428" : ["FL", "IntensifierActiveDimensions"],
        "9429" : ["FL", "PhysicalDetectorSize"],
        "9430" : ["FL", "PositionOfIsocenterProjection"],
        "9432" : ["SQ", "FieldOfViewSequence"],
        "9433" : ["LO", "FieldOfViewDescription"],
        "9434" : ["SQ", "ExposureControlSensingRegionsSequence"],
        "9435" : ["CS", "ExposureControlSensingRegionShape"],
        "9436" : ["SS", "ExposureControlSensingRegionLeftVerticalEdge"],
        "9437" : ["SS", "ExposureControlSensingRegionRightVerticalEdge"],
        "9438" : ["SS", "ExposureControlSensingRegionUpperHorizontalEdge"],
        "9439" : ["SS", "ExposureControlSensingRegionLowerHorizontalEdge"],
        "9440" : ["SS", "CenterOfCircularExposureControlSensingRegion"],
        "9441" : ["US", "RadiusOfCircularExposureControlSensingRegion"],
        "9442" : ["SS", "VerticesOfThePolygonalExposureControlSensingRegion"],
        "9447" : ["FL", "ColumnAngulationPatient"],
        "9449" : ["FL", "BeamAngle"],
        "9451" : ["SQ", "FrameDetectorParametersSequence"],
        "9452" : ["FL", "CalculatedAnatomyThickness"],
        "9455" : ["SQ", "CalibrationSequence"],
        "9456" : ["SQ", "ObjectThicknessSequence"],
        "9457" : ["CS", "PlaneIdentification"],
        "9461" : ["FL", "FieldOfViewDimensionsInFloat"],
        "9462" : ["SQ", "IsocenterReferenceSystemSequence"],
        "9463" : ["FL", "PositionerIsocenterPrimaryAngle"],
        "9464" : ["FL", "PositionerIsocenterSecondaryAngle"],
        "9465" : ["FL", "PositionerIsocenterDetectorRotationAngle"],
        "9466" : ["FL", "TableXPositionToIsocenter"],
        "9467" : ["FL", "TableYPositionToIsocenter"],
        "9468" : ["FL", "TableZPositionToIsocenter"],
        "9469" : ["FL", "TableHorizontalRotationAngle"],
        "9470" : ["FL", "TableHeadTiltAngle"],
        "9471" : ["FL", "TableCradleTiltAngle"],
        "9472" : ["SQ", "FrameDisplayShutterSequence"],
        "9473" : ["FL", "AcquiredImageAreaDoseProduct"],
        "9474" : ["CS", "CArmPositionerTabletopRelationship"],
        "9476" : ["SQ", "XRayGeometrySequence"],
        "9477" : ["SQ", "IrradiationEventIdentificationSequence"],
        "9504" : ["SQ", "XRay3DFrameTypeSequence"],
        "9506" : ["SQ", "ContributingSourcesSequence"],
        "9507" : ["SQ", "XRay3DAcquisitionSequence"],
        "9508" : ["FL", "PrimaryPositionerScanArc"],
        "9509" : ["FL", "SecondaryPositionerScanArc"],
        "9510" : ["FL ", "PrimaryPositionerScanStartAngle"],
        "9511" : ["FL", "SecondaryPositionerScanStartAngle"],
        "9514" : ["FL", "PrimaryPositionerIncrement"],
        "9515" : ["FL", "SecondaryPositionerIncrement"],
        "9516" : ["DT", "StartAcquisitionDateTime"],
        "9517" : ["DT", "EndAcquisitionDateTime"],
        "9524" : ["LO", "ApplicationName"],
        "9525" : ["LO", "ApplicationVersion"],
        "9526" : ["LO", "ApplicationManufacturer"],
        "9527" : ["CS", "AlgorithmType"],
        "9528" : ["LO", "AlgorithmDescription"],
        "9530" : ["SQ", "XRay3DReconstructionSequence"],
        "9531" : ["LO", "ReconstructionDescription"],
        "9538" : ["SQ", "PerProjectionAcquisitionSequence"],
        "9601" : ["SQ", "DiffusionBMatrixSequence"],
        "9602" : ["FD", "DiffusionBValueXX"],
        "9603" : ["FD", "DiffusionBValueXY"],
        "9604" : ["FD", "DiffusionBValueXZ"],
        "9605" : ["FD", "DiffusionBValueYY"],
        "9606" : ["FD", "DiffusionBValueYZ"],
        "9607" : ["FD", "DiffusionBValueZZ"],
        "9701" : ["DT", "DecayCorrectionDateTime"],
        "9715" : ["FD", "StartDensityThreshold"],
        "9716" : ["FD", "StartRelativeDensityDifferenceThreshold"],
        "9717" : ["FD", "StartCardiacTriggerCountThreshold"],
        "9718" : ["FD", "StartRespiratoryTriggerCountThreshold"],
        "9719" : ["FD", "TerminationCountsThreshold"],
        "9720" : ["FD", "TerminationDensityThreshold"],
        "9721" : ["FD", "TerminationRelativeDensityThreshold"],
        "9722" : ["FD", "TerminationTimeThreshold"],
        "9723" : ["FD", "TerminationCardiacTriggerCountThreshold"],
        "9724" : ["FD", "TerminationRespiratoryTriggerCountThreshold"],
        "9725" : ["CS", "DetectorGeometry"],
        "9726" : ["FD", "TransverseDetectorSeparation"],
        "9727" : ["FD", "AxialDetectorDimension"],
        "9729" : ["US", "RadiopharmaceuticalAgentNumber"],
        "9732" : ["SQ", "PETFrameAcquisitionSequence"],
        "9733" : ["SQ", "PETDetectorMotionDetailsSequence"],
        "9734" : ["SQ", "PETTableDynamicsSequence"],
        "9735" : ["SQ", "PETPositionSequence"],
        "9736" : ["SQ", "PETFrameCorrectionFactorsSequence"],
        "9737" : ["SQ", "RadiopharmaceuticalUsageSequence"],
        "9738" : ["CS", "AttenuationCorrectionSource"],
        "9739" : ["US", "NumberOfIterations"],
        "9740" : ["US", "NumberOfSubsets"],
        "9749" : ["SQ", "PETReconstructionSequence"],
        "9751" : ["SQ", "PETFrameTypeSequence"],
        "9755" : ["CS", "TimeOfFlightInformationUsed"],
        "9756" : ["CS", "ReconstructionType"],
        "9758" : ["CS", "DecayCorrected"],
        "9759" : ["CS", "AttenuationCorrected"],
        "9760" : ["CS", "ScatterCorrected"],
        "9761" : ["CS", "DeadTimeCorrected"],
        "9762" : ["CS", "GantryMotionCorrected"],
        "9763" : ["CS", "PatientMotionCorrected"],
        "9764" : ["CS", "CountLossNormalizationCorrected"],
        "9765" : ["CS", "RandomsCorrected"],
        "9766" : ["CS", "NonUniformRadialSamplingCorrected"],
        "9767" : ["CS", "SensitivityCalibrated"],
        "9768" : ["CS", "DetectorNormalizationCorrection"],
        "9769" : ["CS", "IterativeReconstructionMethod"],
        "9770" : ["CS", "AttenuationCorrectionTemporalRelationship"],
        "9771" : ["SQ", "PatientPhysiologicalStateSequence"],
        "9772" : ["SQ", "PatientPhysiologicalStateCodeSequence"],
        "9801" : ["FD", "DepthsOfFocus"],
        "9803" : ["SQ", "ExcludedIntervalsSequence"],
        "9804" : ["DT", "ExclusionStartDatetime"],
        "9805" : ["FD", "ExclusionDuration"],
        "9806" : ["SQ", "USImageDescriptionSequence"],
        "9807" : ["SQ", "ImageDataTypeSequence"],
        "9808" : ["CS", "DataType"],
        "9809" : ["SQ", "TransducerScanPatternCodeSequence"],
        "980B" : ["CS", "AliasedDataType"],
        "980C" : ["CS", "PositionMeasuringDeviceUsed"],
        "980D" : ["SQ", "TransducerGeometryCodeSequence"],
        "980E" : ["SQ", "TransducerBeamSteeringCodeSequence"],
        "980F" : ["SQ", "TransducerApplicationCodeSequence"],
        "A001" : ["SQ", "ContributingEquipmentSequence"],
        "A002" : ["DT", "ContributionDateTime"],
        "A003" : ["ST", "ContributionDescription"]
    },
    "0020" : {
        "000D" : ["UI", "StudyInstanceUID"],
        "000E" : ["UI", "SeriesInstanceUID"],
        "0010" : ["SH", "StudyID"],
        "0011" : ["IS", "SeriesNumber"],
        "0012" : ["IS", "AcquisitionNumber"],
        "0013" : ["IS", "InstanceNumber"],
        "0014" : ["IS", "IsotopeNumber"],
        "0015" : ["IS", "PhaseNumber"],
        "0016" : ["IS", "IntervalNumber"],
        "0017" : ["IS", "TimeSlotNumber"],
        "0018" : ["IS", "AngleNumber"],
        "0019" : ["IS", "ItemNumber"],
        "0020" : ["CS", "PatientOrientation"],
        "0022" : ["IS", "OverlayNumber"],
        "0024" : ["IS", "CurveNumber"],
        "0026" : ["IS", "LUTNumber"],
        "0030" : ["DS", "ImagePosition"],
        "0032" : ["DS", "ImagePositionPatient"],
        "0035" : ["DS", "ImageOrientation"],
        "0037" : ["DS", "ImageOrientationPatient"],
        "0050" : ["DS", "Location"],
        "0052" : ["UI", "FrameOfReferenceUID"],
        "0060" : ["CS", "Laterality"],
        "0062" : ["CS", "ImageLaterality"],
        "0070" : ["LO", "ImageGeometryType"],
        "0080" : ["CS", "MaskingImage"],
        "00AA" : ["IS", "ReportNumber"],
        "0100" : ["IS", "TemporalPositionIdentifier"],
        "0105" : ["IS", "NumberOfTemporalPositions"],
        "0110" : ["DS", "TemporalResolution"],
        "0200" : ["UI", "SynchronizationFrameOfReferenceUID"],
        "0242" : ["UI", "SOPInstanceUIDOfConcatenationSource"],
        "1000" : ["IS", "SeriesInStudy"],
        "1001" : ["IS", "AcquisitionsInSeries"],
        "1002" : ["IS", "ImagesInAcquisition"],
        "1003" : ["IS", "ImagesInSeries"],
        "1004" : ["IS", "AcquisitionsInStudy"],
        "1005" : ["IS", "ImagesInStudy"],
        "1020" : ["LO", "Reference"],
        "1040" : ["LO", "PositionReferenceIndicator"],
        "1041" : ["DS", "SliceLocation"],
        "1070" : ["IS", "OtherStudyNumbers"],
        "1200" : ["IS", "NumberOfPatientRelatedStudies"],
        "1202" : ["IS", "NumberOfPatientRelatedSeries"],
        "1204" : ["IS", "NumberOfPatientRelatedInstances"],
        "1206" : ["IS", "NumberOfStudyRelatedSeries"],
        "1208" : ["IS", "NumberOfStudyRelatedInstances"],
        "1209" : ["IS", "NumberOfSeriesRelatedInstances"],
        "3401" : ["CS", "ModifyingDeviceID"],
        "3402" : ["CS", "ModifiedImageID"],
        "3403" : ["DA", "ModifiedImageDate"],
        "3404" : ["LO", "ModifyingDeviceManufacturer"],
        "3405" : ["TM", "ModifiedImageTime"],
        "3406" : ["LO", "ModifiedImageDescription"],
        "4000" : ["LT", "ImageComments"],
        "5000" : ["AT", "OriginalImageIdentification"],
        "5002" : ["LO", "OriginalImageIdentificationNomenclature"],
        "9056" : ["SH", "StackID"],
        "9057" : ["UL", "InStackPositionNumber"],
        "9071" : ["SQ", "FrameAnatomySequence"],
        "9072" : ["CS", "FrameLaterality"],
        "9111" : ["SQ", "FrameContentSequence"],
        "9113" : ["SQ", "PlanePositionSequence"],
        "9116" : ["SQ", "PlaneOrientationSequence"],
        "9128" : ["UL", "TemporalPositionIndex"],
        "9153" : ["FD", "NominalCardiacTriggerDelayTime"],
        "9154" : ["FL", "NominalCardiacTriggerTimePriorToRPeak"],
        "9155" : ["FL", "ActualCardiacTriggerTimePriorToRPeak"],
        "9156" : ["US", "FrameAcquisitionNumber"],
        "9157" : ["UL", "DimensionIndexValues"],
        "9158" : ["LT", "FrameComments"],
        "9161" : ["UI", "ConcatenationUID"],
        "9162" : ["US", "InConcatenationNumber"],
        "9163" : ["US", "InConcatenationTotalNumber"],
        "9164" : ["UI", "DimensionOrganizationUID"],
        "9165" : ["AT", "DimensionIndexPointer"],
        "9167" : ["AT", "FunctionalGroupPointer"],
        "9213" : ["LO", "DimensionIndexPrivateCreator"],
        "9221" : ["SQ", "DimensionOrganizationSequence"],
        "9222" : ["SQ", "DimensionIndexSequence"],
        "9228" : ["UL", "ConcatenationFrameOffsetNumber"],
        "9238" : ["LO", "FunctionalGroupPrivateCreator"],
        "9241" : ["FL", "NominalPercentageOfCardiacPhase"],
        "9245" : ["FL", "NominalPercentageOfRespiratoryPhase"],
        "9246" : ["FL", "StartingRespiratoryAmplitude"],
        "9247" : ["CS", "StartingRespiratoryPhase"],
        "9248" : ["FL", "EndingRespiratoryAmplitude"],
        "9249" : ["CS", "EndingRespiratoryPhase"],
        "9250" : ["CS", "RespiratoryTriggerType"],
        "9251" : ["FD", "RRIntervalTimeNominal"],
        "9252" : ["FD", "ActualCardiacTriggerDelayTime"],
        "9253" : ["SQ", "RespiratorySynchronizationSequence"],
        "9254" : ["FD", "RespiratoryIntervalTime"],
        "9255" : ["FD", "NominalRespiratoryTriggerDelayTime"],
        "9256" : ["FD", "RespiratoryTriggerDelayThreshold"],
        "9257" : ["FD", "ActualRespiratoryTriggerDelayTime"],
        "9301" : ["FD", "ImagePositionVolume"],
        "9302" : ["FD", "ImageOrientationVolume"],
        "9307" : ["CS", "UltrasoundAcquisitionGeometry"],
        "9308" : ["FD", "ApexPosition"],
        "9309" : ["FD", "VolumeToTransducerMappingMatrix"],
        "930A" : ["FD", "VolumeToTableMappingMatrix"],
        "930C" : ["CS", "PatientFrameOfReferenceSource"],
        "930D" : ["FD", "TemporalPositionTimeOffset"],
        "930E" : ["SQ", "PlanePositionVolumeSequence"],
        "930F" : ["SQ", "PlaneOrientationVolumeSequence"],
        "9310" : ["SQ", "TemporalPositionSequence"],
        "9311" : ["CS", "DimensionOrganizationType"],
        "9312" : ["UI", "VolumeFrameOfReferenceUID"],
        "9313" : ["UI", "TableFrameOfReferenceUID"],
        "9421" : ["LO", "DimensionDescriptionLabel"],
        "9450" : ["SQ", "PatientOrientationInFrameSequence"],
        "9453" : ["LO", "FrameLabel"],
        "9518" : ["US", "AcquisitionIndex"],
        "9529" : ["SQ", "ContributingSOPInstancesReferenceSequence"],
        "9536" : ["US", "ReconstructionIndex"]
    },
    "0022" : {
        "0001" : ["US", "LightPathFilterPassThroughWavelength"],
        "0002" : ["US", "LightPathFilterPassBand"],
        "0003" : ["US", "ImagePathFilterPassThroughWavelength"],
        "0004" : ["US", "ImagePathFilterPassBand"],
        "0005" : ["CS", "PatientEyeMovementCommanded"],
        "0006" : ["SQ", "PatientEyeMovementCommandCodeSequence"],
        "0007" : ["FL", "SphericalLensPower"],
        "0008" : ["FL", "CylinderLensPower"],
        "0009" : ["FL", "CylinderAxis"],
        "000A" : ["FL", "EmmetropicMagnification"],
        "000B" : ["FL", "IntraOcularPressure"],
        "000C" : ["FL", "HorizontalFieldOfView"],
        "000D" : ["CS", "PupilDilated"],
        "000E" : ["FL", "DegreeOfDilation"],
        "0010" : ["FL", "StereoBaselineAngle"],
        "0011" : ["FL", "StereoBaselineDisplacement"],
        "0012" : ["FL", "StereoHorizontalPixelOffset"],
        "0013" : ["FL", "StereoVerticalPixelOffset"],
        "0014" : ["FL", "StereoRotation"],
        "0015" : ["SQ", "AcquisitionDeviceTypeCodeSequence"],
        "0016" : ["SQ", "IlluminationTypeCodeSequence"],
        "0017" : ["SQ", "LightPathFilterTypeStackCodeSequence"],
        "0018" : ["SQ", "ImagePathFilterTypeStackCodeSequence"],
        "0019" : ["SQ", "LensesCodeSequence"],
        "001A" : ["SQ", "ChannelDescriptionCodeSequence"],
        "001B" : ["SQ", "RefractiveStateSequence"],
        "001C" : ["SQ", "MydriaticAgentCodeSequence"],
        "001D" : ["SQ", "RelativeImagePositionCodeSequence"],
        "001E" : ["FL", "CameraAngleOfView"],
        "0020" : ["SQ", "StereoPairsSequence"],
        "0021" : ["SQ", "LeftImageSequence"],
        "0022" : ["SQ", "RightImageSequence"],
        "0030" : ["FL", "AxialLengthOfTheEye"],
        "0031" : ["SQ", "OphthalmicFrameLocationSequence"],
        "0032" : ["FL", "ReferenceCoordinates"],
        "0035" : ["FL", "DepthSpatialResolution"],
        "0036" : ["FL", "MaximumDepthDistortion"],
        "0037" : ["FL", "AlongScanSpatialResolution"],
        "0038" : ["FL", "MaximumAlongScanDistortion"],
        "0039" : ["CS", "OphthalmicImageOrientation"],
        "0041" : ["FL", "DepthOfTransverseImage"],
        "0042" : ["SQ", "MydriaticAgentConcentrationUnitsSequence"],
        "0048" : ["FL", "AcrossScanSpatialResolution"],
        "0049" : ["FL", "MaximumAcrossScanDistortion"],
        "004E" : ["DS", "MydriaticAgentConcentration"],
        "0055" : ["FL", "IlluminationWaveLength"],
        "0056" : ["FL", "IlluminationPower"],
        "0057" : ["FL", "IlluminationBandwidth"],
        "0058" : ["SQ", "MydriaticAgentSequence"],
        "1007" : ["SQ", "OphthalmicAxialMeasurementsRightEyeSequence"],
        "1008" : ["SQ", "OphthalmicAxialMeasurementsLeftEyeSequence"],
        "1010" : ["CS", "OphthalmicAxialLengthMeasurementsType"],
        "1019" : ["FL", "OphthalmicAxialLength"],
        "1024" : ["SQ", "LensStatusCodeSequence"],
        "1025" : ["SQ", "VitreousStatusCodeSequence"],
        "1028" : ["SQ", "IOLFormulaCodeSequence"],
        "1029" : ["LO", "IOLFormulaDetail"],
        "1033" : ["FL", "KeratometerIndex"],
        "1035" : ["SQ", "SourceOfOphthalmicAxialLengthCodeSequence"],
        "1037" : ["FL", "TargetRefraction"],
        "1039" : ["CS", "RefractiveProcedureOccurred"],
        "1040" : ["SQ", "RefractiveSurgeryTypeCodeSequence"],
        "1044" : ["SQ", "OphthalmicUltrasoundAxialMeasurementsTypeCodeSequence"],
        "1050" : ["SQ", "OphthalmicAxialLengthMeasurementsSequence"],
        "1053" : ["FL", "IOLPower"],
        "1054" : ["FL", "PredictedRefractiveError"],
        "1059" : ["FL", "OphthalmicAxialLengthVelocity"],
        "1065" : ["LO", "LensStatusDescription"],
        "1066" : ["LO", "VitreousStatusDescription"],
        "1090" : ["SQ", "IOLPowerSequence"],
        "1092" : ["SQ", "LensConstantSequence"],
        "1093" : ["LO", "IOLManufacturer"],
        "1094" : ["LO", "LensConstantDescription"],
        "1096" : ["SQ", "KeratometryMeasurementTypeCodeSequence"],
        "1100" : ["SQ", "ReferencedOphthalmicAxialMeasurementsSequence"],
        "1101" : ["SQ", "OphthalmicAxialLengthMeasurementsSegmentNameCodeSequence"],
        "1103" : ["SQ", "RefractiveErrorBeforeRefractiveSurgeryCodeSequence"],
        "1121" : ["FL", "IOLPowerForExactEmmetropia"],
        "1122" : ["FL", "IOLPowerForExactTargetRefraction"],
        "1125" : ["SQ", "AnteriorChamberDepthDefinitionCodeSequence"],
        "1130" : ["FL", "LensThickness"],
        "1131" : ["FL", "AnteriorChamberDepth"],
        "1132" : ["SQ", "SourceOfLensThicknessDataCodeSequence"],
        "1133" : ["SQ", "SourceOfAnteriorChamberDepthDataCodeSequence"],
        "1135" : ["SQ", "SourceOfRefractiveErrorDataCodeSequence"],
        "1140" : ["CS", "OphthalmicAxialLengthMeasurementModified"],
        "1150" : ["SQ", "OphthalmicAxialLengthDataSourceCodeSequence"],
        "1153" : ["SQ", "OphthalmicAxialLengthAcquisitionMethodCodeSequence"],
        "1155" : ["FL", "SignalToNoiseRatio"],
        "1159" : ["LO", "OphthalmicAxialLengthDataSourceDescription"],
        "1210" : ["SQ", "OphthalmicAxialLengthMeasurementsTotalLengthSequence"],
        "1211" : ["SQ", "OphthalmicAxialLengthMeasurementsSegmentalLengthSequence"],
        "1212" : ["SQ", "OphthalmicAxialLengthMeasurementsLengthSummationSequence"],
        "1220" : ["SQ", "UltrasoundOphthalmicAxialLengthMeasurementsSequence"],
        "1225" : ["SQ", "OpticalOphthalmicAxialLengthMeasurementsSequence"],
        "1230" : ["SQ", "UltrasoundSelectedOphthalmicAxialLengthSequence"],
        "1250" : ["SQ", "OphthalmicAxialLengthSelectionMethodCodeSequence"],
        "1255" : ["SQ", "OpticalSelectedOphthalmicAxialLengthSequence"],
        "1257" : ["SQ", "SelectedSegmentalOphthalmicAxialLengthSequence"],
        "1260" : ["SQ", "SelectedTotalOphthalmicAxialLengthSequence"],
        "1262" : ["SQ", "OphthalmicAxialLengthQualityMetricSequence"],
        "1273" : ["LO", "OphthalmicAxialLengthQualityMetricTypeDescription"],
        "1300" : ["SQ", "IntraocularLensCalculationsRightEyeSequence"],
        "1310" : ["SQ", "IntraocularLensCalculationsLeftEyeSequence"],
        "1330" : ["SQ", "ReferencedOphthalmicAxialLengthMeasurementQCImageSequence"]
    },
    "0024" : {
        "0010" : ["FL", "VisualFieldHorizontalExtent"],
        "0011" : ["FL", "VisualFieldVerticalExtent"],
        "0012" : ["CS", "VisualFieldShape"],
        "0016" : ["SQ", "ScreeningTestModeCodeSequence"],
        "0018" : ["FL", "MaximumStimulusLuminance"],
        "0020" : ["FL", "BackgroundLuminance"],
        "0021" : ["SQ", "StimulusColorCodeSequence"],
        "0024" : ["SQ", "BackgroundIlluminationColorCodeSequence"],
        "0025" : ["FL", "StimulusArea"],
        "0028" : ["FL", "StimulusPresentationTime"],
        "0032" : ["SQ", "FixationSequence"],
        "0033" : ["SQ", "FixationMonitoringCodeSequence"],
        "0034" : ["SQ", "VisualFieldCatchTrialSequence"],
        "0035" : ["US", "FixationCheckedQuantity"],
        "0036" : ["US", "PatientNotProperlyFixatedQuantity"],
        "0037" : ["CS", "PresentedVisualStimuliDataFlag"],
        "0038" : ["US", "NumberOfVisualStimuli"],
        "0039" : ["CS", "ExcessiveFixationLossesDataFlag"],
        "0040" : ["CS", "ExcessiveFixationLosses"],
        "0042" : ["US", "StimuliRetestingQuantity"],
        "0044" : ["LT", "CommentsOnPatientPerformanceOfVisualField"],
        "0045" : ["CS", "FalseNegativesEstimateFlag"],
        "0046" : ["FL", "FalseNegativesEstimate"],
        "0048" : ["US", "NegativeCatchTrialsQuantity"],
        "0050" : ["US", "FalseNegativesQuantity"],
        "0051" : ["CS", "ExcessiveFalseNegativesDataFlag"],
        "0052" : ["CS", "ExcessiveFalseNegatives"],
        "0053" : ["CS", "FalsePositivesEstimateFlag"],
        "0054" : ["FL", "FalsePositivesEstimate"],
        "0055" : ["CS", "CatchTrialsDataFlag"],
        "0056" : ["US", "PositiveCatchTrialsQuantity"],
        "0057" : ["CS", "TestPointNormalsDataFlag"],
        "0058" : ["SQ", "TestPointNormalsSequence"],
        "0059" : ["CS", "GlobalDeviationProbabilityNormalsFlag"],
        "0060" : ["US", "FalsePositivesQuantity"],
        "0061" : ["CS", "ExcessiveFalsePositivesDataFlag"],
        "0062" : ["CS", "ExcessiveFalsePositives"],
        "0063" : ["CS", "VisualFieldTestNormalsFlag"],
        "0064" : ["SQ", "ResultsNormalsSequence"],
        "0065" : ["SQ", "AgeCorrectedSensitivityDeviationAlgorithmSequence"],
        "0066" : ["FL", "GlobalDeviationFromNormal"],
        "0067" : ["SQ", "GeneralizedDefectSensitivityDeviationAlgorithmSequence"],
        "0068" : ["FL", "LocalizedDeviationfromNormal"],
        "0069" : ["LO", "PatientReliabilityIndicator"],
        "0070" : ["FL", "VisualFieldMeanSensitivity"],
        "0071" : ["FL", "GlobalDeviationProbability"],
        "0072" : ["CS", "LocalDeviationProbabilityNormalsFlag"],
        "0073" : ["FL", "LocalizedDeviationProbability"],
        "0074" : ["CS", "ShortTermFluctuationCalculated"],
        "0075" : ["FL", "ShortTermFluctuation"],
        "0076" : ["CS", "ShortTermFluctuationProbabilityCalculated"],
        "0077" : ["FL", "ShortTermFluctuationProbability"],
        "0078" : ["CS", "CorrectedLocalizedDeviationFromNormalCalculated"],
        "0079" : ["FL", "CorrectedLocalizedDeviationFromNormal"],
        "0080" : ["CS", "CorrectedLocalizedDeviationFromNormalProbabilityCalculated"],
        "0081" : ["FL", "CorrectedLocalizedDeviationFromNormalProbability"],
        "0083" : ["SQ", "GlobalDeviationProbabilitySequence"],
        "0085" : ["SQ", "LocalizedDeviationProbabilitySequence"],
        "0086" : ["CS", "FovealSensitivityMeasured"],
        "0087" : ["FL", "FovealSensitivity"],
        "0088" : ["FL", "VisualFieldTestDuration"],
        "0089" : ["SQ", "VisualFieldTestPointSequence"],
        "0090" : ["FL", "VisualFieldTestPointXCoordinate"],
        "0091" : ["FL", "VisualFieldTestPointYCoordinate"],
        "0092" : ["FL", "AgeCorrectedSensitivityDeviationValue"],
        "0093" : ["CS", "StimulusResults"],
        "0094" : ["FL", "SensitivityValue"],
        "0095" : ["CS", "RetestStimulusSeen"],
        "0096" : ["FL", "RetestSensitivityValue"],
        "0097" : ["SQ", "VisualFieldTestPointNormalsSequence"],
        "0098" : ["FL", "QuantifiedDefect"],
        "0100" : ["FL", "AgeCorrectedSensitivityDeviationProbabilityValue"],
        "0102" : ["CS", "GeneralizedDefectCorrectedSensitivityDeviationFlag "],
        "0103" : ["FL", "GeneralizedDefectCorrectedSensitivityDeviationValue "],
        "0104" : ["FL", "GeneralizedDefectCorrectedSensitivityDeviationProbabilityValue"],
        "0105" : ["FL ", "MinimumSensitivityValue"],
        "0106" : ["CS", "BlindSpotLocalized"],
        "0107" : ["FL", "BlindSpotXCoordinate"],
        "0108" : ["FL", "BlindSpotYCoordinate "],
        "0110" : ["SQ", "VisualAcuityMeasurementSequence"],
        "0112" : ["SQ", "RefractiveParametersUsedOnPatientSequence"],
        "0113" : ["CS", "MeasurementLaterality"],
        "0114" : ["SQ", "OphthalmicPatientClinicalInformationLeftEyeSequence"],
        "0115" : ["SQ", "OphthalmicPatientClinicalInformationRightEyeSequence"],
        "0117" : ["CS", "FovealPointNormativeDataFlag"],
        "0118" : ["FL", "FovealPointProbabilityValue"],
        "0120" : ["CS", "ScreeningBaselineMeasured"],
        "0122" : ["SQ", "ScreeningBaselineMeasuredSequence"],
        "0124" : ["CS", "ScreeningBaselineType"],
        "0126" : ["FL", "ScreeningBaselineValue"],
        "0202" : ["LO", "AlgorithmSource"],
        "0306" : ["LO", "DataSetName"],
        "0307" : ["LO", "DataSetVersion"],
        "0308" : ["LO", "DataSetSource"],
        "0309" : ["LO", "DataSetDescription"],
        "0317" : ["SQ", "VisualFieldTestReliabilityGlobalIndexSequence"],
        "0320" : ["SQ", "VisualFieldGlobalResultsIndexSequence"],
        "0325" : ["SQ", "DataObservationSequence"],
        "0338" : ["CS", "IndexNormalsFlag"],
        "0341" : ["FL", "IndexProbability"],
        "0344" : ["SQ", "IndexProbabilitySequence"]
    },
    "0028" : {
        "0002" : ["US", "SamplesPerPixel"],
        "0003" : ["US", "SamplesPerPixelUsed"],
        "0004" : ["CS", "PhotometricInterpretation"],
        "0005" : ["US", "ImageDimensions"],
        "0006" : ["US", "PlanarConfiguration"],
        "0008" : ["IS", "NumberOfFrames"],
        "0009" : ["AT", "FrameIncrementPointer"],
        "000A" : ["AT", "FrameDimensionPointer"],
        "0010" : ["US", "Rows"],
        "0011" : ["US", "Columns"],
        "0012" : ["US", "Planes"],
        "0014" : ["US", "UltrasoundColorDataPresent"],
        "0030" : ["DS", "PixelSpacing"],
        "0031" : ["DS", "ZoomFactor"],
        "0032" : ["DS", "ZoomCenter"],
        "0034" : ["IS", "PixelAspectRatio"],
        "0040" : ["CS", "ImageFormat"],
        "0050" : ["LO", "ManipulatedImage"],
        "0051" : ["CS", "CorrectedImage"],
        "005F" : ["LO", "CompressionRecognitionCode"],
        "0060" : ["CS", "CompressionCode"],
        "0061" : ["SH", "CompressionOriginator"],
        "0062" : ["LO", "CompressionLabel"],
        "0063" : ["SH", "CompressionDescription"],
        "0065" : ["CS", "CompressionSequence"],
        "0066" : ["AT", "CompressionStepPointers"],
        "0068" : ["US", "RepeatInterval"],
        "0069" : ["US", "BitsGrouped"],
        "0070" : ["US", "PerimeterTable"],
        "0071" : ["SS", "PerimeterValue"],
        "0080" : ["US", "PredictorRows"],
        "0081" : ["US", "PredictorColumns"],
        "0082" : ["US", "PredictorConstants"],
        "0090" : ["CS", "BlockedPixels"],
        "0091" : ["US", "BlockRows"],
        "0092" : ["US", "BlockColumns"],
        "0093" : ["US", "RowOverlap"],
        "0094" : ["US", "ColumnOverlap"],
        "0100" : ["US", "BitsAllocated"],
        "0101" : ["US", "BitsStored"],
        "0102" : ["US", "HighBit"],
        "0103" : ["US", "PixelRepresentation"],
        "0104" : ["SS", "SmallestValidPixelValue"],
        "0105" : ["SS", "LargestValidPixelValue"],
        "0106" : ["SS", "SmallestImagePixelValue"],
        "0107" : ["SS", "LargestImagePixelValue"],
        "0108" : ["SS", "SmallestPixelValueInSeries"],
        "0109" : ["SS", "LargestPixelValueInSeries"],
        "0110" : ["SS", "SmallestImagePixelValueInPlane"],
        "0111" : ["SS", "LargestImagePixelValueInPlane"],
        "0120" : ["SS", "PixelPaddingValue"],
        "0121" : ["SS", "PixelPaddingRangeLimit"],
        "0200" : ["US", "ImageLocation"],
        "0300" : ["CS", "QualityControlImage"],
        "0301" : ["CS", "BurnedInAnnotation"],
        "0302" : ["CS", "RecognizableVisualFeatures"],
        "0303" : ["CS", "LongitudinalTemporalInformationModified"],
        "0400" : ["LO", "TransformLabel"],
        "0401" : ["LO", "TransformVersionNumber"],
        "0402" : ["US", "NumberOfTransformSteps"],
        "0403" : ["LO", "SequenceOfCompressedData"],
        "0404" : ["AT", "DetailsOfCoefficients"],
        "0700" : ["LO", "DCTLabel"],
        "0701" : ["CS", "DataBlockDescription"],
        "0702" : ["AT", "DataBlock"],
        "0710" : ["US", "NormalizationFactorFormat"],
        "0720" : ["US", "ZonalMapNumberFormat"],
        "0721" : ["AT", "ZonalMapLocation"],
        "0722" : ["US", "ZonalMapFormat"],
        "0730" : ["US", "AdaptiveMapFormat"],
        "0740" : ["US", "CodeNumberFormat"],
        "0A02" : ["CS", "PixelSpacingCalibrationType"],
        "0A04" : ["LO", "PixelSpacingCalibrationDescription"],
        "1040" : ["CS", "PixelIntensityRelationship"],
        "1041" : ["SS", "PixelIntensityRelationshipSign"],
        "1050" : ["DS", "WindowCenter"],
        "1051" : ["DS", "WindowWidth"],
        "1052" : ["DS", "RescaleIntercept"],
        "1053" : ["DS", "RescaleSlope"],
        "1054" : ["LO", "RescaleType"],
        "1055" : ["LO", "WindowCenterWidthExplanation"],
        "1056" : ["CS", "VOILUTFunction"],
        "1080" : ["CS", "GrayScale"],
        "1090" : ["CS", "RecommendedViewingMode"],
        "1100" : ["SS", "GrayLookupTableDescriptor"],
        "1101" : ["SS", "RedPaletteColorLookupTableDescriptor"],
        "1102" : ["SS", "GreenPaletteColorLookupTableDescriptor"],
        "1103" : ["SS", "BluePaletteColorLookupTableDescriptor"],
        "1104" : ["US", "AlphaPaletteColorLookupTableDescriptor"],
        "1111" : ["SS", "LargeRedPaletteColorLookupTableDescriptor"],
        "1112" : ["SS", "LargeGreenPaletteColorLookupTableDescriptor"],
        "1113" : ["SS", "LargeBluePaletteColorLookupTableDescriptor"],
        "1199" : ["UI", "PaletteColorLookupTableUID"],
        "1200" : ["OW", "GrayLookupTableData"],
        "1201" : ["OW", "RedPaletteColorLookupTableData"],
        "1202" : ["OW", "GreenPaletteColorLookupTableData"],
        "1203" : ["OW", "BluePaletteColorLookupTableData"],
        "1204" : ["OW", "AlphaPaletteColorLookupTableData"],
        "1211" : ["OW", "LargeRedPaletteColorLookupTableData"],
        "1212" : ["OW", "LargeGreenPaletteColorLookupTableData"],
        "1213" : ["OW", "LargeBluePaletteColorLookupTableData"],
        "1214" : ["UI", "LargePaletteColorLookupTableUID"],
        "1221" : ["OW", "SegmentedRedPaletteColorLookupTableData"],
        "1222" : ["OW", "SegmentedGreenPaletteColorLookupTableData"],
        "1223" : ["OW", "SegmentedBluePaletteColorLookupTableData"],
        "1300" : ["CS", "BreastImplantPresent"],
        "1350" : ["CS", "PartialView"],
        "1351" : ["ST", "PartialViewDescription"],
        "1352" : ["SQ", "PartialViewCodeSequence"],
        "135A" : ["CS", "SpatialLocationsPreserved"],
        "1401" : ["SQ", "DataFrameAssignmentSequence"],
        "1402" : ["CS", "DataPathAssignment"],
        "1403" : ["US", "BitsMappedToColorLookupTable"],
        "1404" : ["SQ", "BlendingLUT1Sequence"],
        "1405" : ["CS", "BlendingLUT1TransferFunction"],
        "1406" : ["FD", "BlendingWeightConstant"],
        "1407" : ["US", "BlendingLookupTableDescriptor"],
        "1408" : ["OW", "BlendingLookupTableData"],
        "140B" : ["SQ", "EnhancedPaletteColorLookupTableSequence"],
        "140C" : ["SQ", "BlendingLUT2Sequence"],
        "140D" : ["CS", "BlendingLUT2TransferFunction"],
        "140E" : ["CS", "DataPathID"],
        "140F" : ["CS", "RGBLUTTransferFunction"],
        "1410" : ["CS", "AlphaLUTTransferFunction"],
        "2000" : ["OB", "ICCProfile"],
        "2110" : ["CS", "LossyImageCompression"],
        "2112" : ["DS", "LossyImageCompressionRatio"],
        "2114" : ["CS", "LossyImageCompressionMethod"],
        "3000" : ["SQ", "ModalityLUTSequence"],
        "3002" : ["SS", "LUTDescriptor"],
        "3003" : ["LO", "LUTExplanation"],
        "3004" : ["LO", "ModalityLUTType"],
        "3006" : ["OW", "LUTData"],
        "3010" : ["SQ", "VOILUTSequence"],
        "3110" : ["SQ", "SoftcopyVOILUTSequence"],
        "4000" : ["LT", "ImagePresentationComments"],
        "5000" : ["SQ", "BiPlaneAcquisitionSequence"],
        "6010" : ["US", "RepresentativeFrameNumber"],
        "6020" : ["US", "FrameNumbersOfInterest"],
        "6022" : ["LO", "FrameOfInterestDescription"],
        "6023" : ["CS", "FrameOfInterestType"],
        "6030" : ["US", "MaskPointers"],
        "6040" : ["US", "RWavePointer"],
        "6100" : ["SQ", "MaskSubtractionSequence"],
        "6101" : ["CS", "MaskOperation"],
        "6102" : ["US", "ApplicableFrameRange"],
        "6110" : ["US", "MaskFrameNumbers"],
        "6112" : ["US", "ContrastFrameAveraging"],
        "6114" : ["FL", "MaskSubPixelShift"],
        "6120" : ["SS", "TIDOffset"],
        "6190" : ["ST", "MaskOperationExplanation"],
        "7FE0" : ["UT", "PixelDataProviderURL"],
        "9001" : ["UL", "DataPointRows"],
        "9002" : ["UL", "DataPointColumns"],
        "9003" : ["CS", "SignalDomainColumns"],
        "9099" : ["US", "LargestMonochromePixelValue"],
        "9108" : ["CS", "DataRepresentation"],
        "9110" : ["SQ", "PixelMeasuresSequence"],
        "9132" : ["SQ", "FrameVOILUTSequence"],
        "9145" : ["SQ", "PixelValueTransformationSequence"],
        "9235" : ["CS", "SignalDomainRows"],
        "9411" : ["FL", "DisplayFilterPercentage"],
        "9415" : ["SQ", "FramePixelShiftSequence"],
        "9416" : ["US", "SubtractionItemID"],
        "9422" : ["SQ", "PixelIntensityRelationshipLUTSequence"],
        "9443" : ["SQ", "FramePixelDataPropertiesSequence"],
        "9444" : ["CS", "GeometricalProperties"],
        "9445" : ["FL", "GeometricMaximumDistortion"],
        "9446" : ["CS", "ImageProcessingApplied"],
        "9454" : ["CS", "MaskSelectionMode"],
        "9474" : ["CS", "LUTFunction"],
        "9478" : ["FL", "MaskVisibilityPercentage"],
        "9501" : ["SQ", "PixelShiftSequence"],
        "9502" : ["SQ", "RegionPixelShiftSequence"],
        "9503" : ["SS", "VerticesOfTheRegion"],
        "9505" : ["SQ", "MultiFramePresentationSequence"],
        "9506" : ["US", "PixelShiftFrameRange"],
        "9507" : ["US", "LUTFrameRange"],
        "9520" : ["DS", "ImageToEquipmentMappingMatrix"],
        "9537" : ["CS", "EquipmentCoordinateSystemIdentification"]
    },
    "0032" : {
        "000A" : ["CS", "StudyStatusID"],
        "000C" : ["CS", "StudyPriorityID"],
        "0012" : ["LO", "StudyIDIssuer"],
        "0032" : ["DA", "StudyVerifiedDate"],
        "0033" : ["TM", "StudyVerifiedTime"],
        "0034" : ["DA", "StudyReadDate"],
        "0035" : ["TM", "StudyReadTime"],
        "1000" : ["DA", "ScheduledStudyStartDate"],
        "1001" : ["TM", "ScheduledStudyStartTime"],
        "1010" : ["DA", "ScheduledStudyStopDate"],
        "1011" : ["TM", "ScheduledStudyStopTime"],
        "1020" : ["LO", "ScheduledStudyLocation"],
        "1021" : ["AE", "ScheduledStudyLocationAETitle"],
        "1030" : ["LO", "ReasonForStudy"],
        "1031" : ["SQ", "RequestingPhysicianIdentificationSequence"],
        "1032" : ["PN", "RequestingPhysician"],
        "1033" : ["LO", "RequestingService"],
        "1034" : ["SQ", "RequestingServiceCodeSequence"],
        "1040" : ["DA", "StudyArrivalDate"],
        "1041" : ["TM", "StudyArrivalTime"],
        "1050" : ["DA", "StudyCompletionDate"],
        "1051" : ["TM", "StudyCompletionTime"],
        "1055" : ["CS", "StudyComponentStatusID"],
        "1060" : ["LO", "RequestedProcedureDescription"],
        "1064" : ["SQ", "RequestedProcedureCodeSequence"],
        "1070" : ["LO", "RequestedContrastAgent"],
        "4000" : ["LT", "StudyComments"]
    },
    "0038" : {
        "0004" : ["SQ", "ReferencedPatientAliasSequence"],
        "0008" : ["CS", "VisitStatusID"],
        "0010" : ["LO", "AdmissionID"],
        "0011" : ["LO", "IssuerOfAdmissionID"],
        "0014" : ["SQ", "IssuerOfAdmissionIDSequence"],
        "0016" : ["LO", "RouteOfAdmissions"],
        "001A" : ["DA", "ScheduledAdmissionDate"],
        "001B" : ["TM", "ScheduledAdmissionTime"],
        "001C" : ["DA", "ScheduledDischargeDate"],
        "001D" : ["TM", "ScheduledDischargeTime"],
        "001E" : ["LO", "ScheduledPatientInstitutionResidence"],
        "0020" : ["DA", "AdmittingDate"],
        "0021" : ["TM", "AdmittingTime"],
        "0030" : ["DA", "DischargeDate"],
        "0032" : ["TM", "DischargeTime"],
        "0040" : ["LO", "DischargeDiagnosisDescription"],
        "0044" : ["SQ", "DischargeDiagnosisCodeSequence"],
        "0050" : ["LO", "SpecialNeeds"],
        "0060" : ["LO", "ServiceEpisodeID"],
        "0061" : ["LO", "IssuerOfServiceEpisodeID"],
        "0062" : ["LO", "ServiceEpisodeDescription"],
        "0064" : ["SQ", "IssuerOfServiceEpisodeIDSequence"],
        "0100" : ["SQ", "PertinentDocumentsSequence"],
        "0300" : ["LO", "CurrentPatientLocation"],
        "0400" : ["LO", "PatientInstitutionResidence"],
        "0500" : ["LO", "PatientState"],
        "0502" : ["SQ", "PatientClinicalTrialParticipationSequence"],
        "4000" : ["LT", "VisitComments"]
    },
    "003A" : {
        "0004" : ["CS", "WaveformOriginality"],
        "0005" : ["US", "NumberOfWaveformChannels"],
        "0010" : ["UL", "NumberOfWaveformSamples"],
        "001A" : ["DS", "SamplingFrequency"],
        "0020" : ["SH", "MultiplexGroupLabel"],
        "0200" : ["SQ", "ChannelDefinitionSequence"],
        "0202" : ["IS", "WaveformChannelNumber"],
        "0203" : ["SH", "ChannelLabel"],
        "0205" : ["CS", "ChannelStatus"],
        "0208" : ["SQ", "ChannelSourceSequence"],
        "0209" : ["SQ", "ChannelSourceModifiersSequence"],
        "020A" : ["SQ", "SourceWaveformSequence"],
        "020C" : ["LO", "ChannelDerivationDescription"],
        "0210" : ["DS", "ChannelSensitivity"],
        "0211" : ["SQ", "ChannelSensitivityUnitsSequence"],
        "0212" : ["DS", "ChannelSensitivityCorrectionFactor"],
        "0213" : ["DS", "ChannelBaseline"],
        "0214" : ["DS", "ChannelTimeSkew"],
        "0215" : ["DS", "ChannelSampleSkew"],
        "0218" : ["DS", "ChannelOffset"],
        "021A" : ["US", "WaveformBitsStored"],
        "0220" : ["DS", "FilterLowFrequency"],
        "0221" : ["DS", "FilterHighFrequency"],
        "0222" : ["DS", "NotchFilterFrequency"],
        "0223" : ["DS", "NotchFilterBandwidth"],
        "0230" : ["FL", "WaveformDataDisplayScale"],
        "0231" : ["US", "WaveformDisplayBackgroundCIELabValue"],
        "0240" : ["SQ", "WaveformPresentationGroupSequence"],
        "0241" : ["US", "PresentationGroupNumber"],
        "0242" : ["SQ", "ChannelDisplaySequence"],
        "0244" : ["US", "ChannelRecommendedDisplayCIELabValue"],
        "0245" : ["FL", "ChannelPosition"],
        "0246" : ["CS", "DisplayShadingFlag"],
        "0247" : ["FL", "FractionalChannelDisplayScale"],
        "0248" : ["FL", "AbsoluteChannelDisplayScale"],
        "0300" : ["SQ", "MultiplexedAudioChannelsDescriptionCodeSequence"],
        "0301" : ["IS", "ChannelIdentificationCode"],
        "0302" : ["CS", "ChannelMode"]
    },
    "0040" : {
        "0001" : ["AE", "ScheduledStationAETitle"],
        "0002" : ["DA", "ScheduledProcedureStepStartDate"],
        "0003" : ["TM", "ScheduledProcedureStepStartTime"],
        "0004" : ["DA", "ScheduledProcedureStepEndDate"],
        "0005" : ["TM", "ScheduledProcedureStepEndTime"],
        "0006" : ["PN", "ScheduledPerformingPhysicianName"],
        "0007" : ["LO", "ScheduledProcedureStepDescription"],
        "0008" : ["SQ", "ScheduledProtocolCodeSequence"],
        "0009" : ["SH", "ScheduledProcedureStepID"],
        "000A" : ["SQ", "StageCodeSequence"],
        "000B" : ["SQ", "ScheduledPerformingPhysicianIdentificationSequence"],
        "0010" : ["SH", "ScheduledStationName"],
        "0011" : ["SH", "ScheduledProcedureStepLocation"],
        "0012" : ["LO", "PreMedication"],
        "0020" : ["CS", "ScheduledProcedureStepStatus"],
        "0026" : ["SQ", "OrderPlacerIdentifierSequence"],
        "0027" : ["SQ", "OrderFillerIdentifierSequence"],
        "0031" : ["UT", "LocalNamespaceEntityID"],
        "0032" : ["UT", "UniversalEntityID"],
        "0033" : ["CS", "UniversalEntityIDType"],
        "0035" : ["CS", "IdentifierTypeCode"],
        "0036" : ["SQ", "AssigningFacilitySequence"],
        "0039" : ["SQ", "AssigningJurisdictionCodeSequence"],
        "003A" : ["SQ", "AssigningAgencyOrDepartmentCodeSequence"],
        "0100" : ["SQ", "ScheduledProcedureStepSequence"],
        "0220" : ["SQ", "ReferencedNonImageCompositeSOPInstanceSequence"],
        "0241" : ["AE", "PerformedStationAETitle"],
        "0242" : ["SH", "PerformedStationName"],
        "0243" : ["SH", "PerformedLocation"],
        "0244" : ["DA", "PerformedProcedureStepStartDate"],
        "0245" : ["TM", "PerformedProcedureStepStartTime"],
        "0250" : ["DA", "PerformedProcedureStepEndDate"],
        "0251" : ["TM", "PerformedProcedureStepEndTime"],
        "0252" : ["CS", "PerformedProcedureStepStatus"],
        "0253" : ["SH", "PerformedProcedureStepID"],
        "0254" : ["LO", "PerformedProcedureStepDescription"],
        "0255" : ["LO", "PerformedProcedureTypeDescription"],
        "0260" : ["SQ", "PerformedProtocolCodeSequence"],
        "0261" : ["CS", "PerformedProtocolType"],
        "0270" : ["SQ", "ScheduledStepAttributesSequence"],
        "0275" : ["SQ", "RequestAttributesSequence"],
        "0280" : ["ST", "CommentsOnThePerformedProcedureStep"],
        "0281" : ["SQ", "PerformedProcedureStepDiscontinuationReasonCodeSequence"],
        "0293" : ["SQ", "QuantitySequence"],
        "0294" : ["DS", "Quantity"],
        "0295" : ["SQ", "MeasuringUnitsSequence"],
        "0296" : ["SQ", "BillingItemSequence"],
        "0300" : ["US", "TotalTimeOfFluoroscopy"],
        "0301" : ["US", "TotalNumberOfExposures"],
        "0302" : ["US", "EntranceDose"],
        "0303" : ["US", "ExposedArea"],
        "0306" : ["DS", "DistanceSourceToEntrance"],
        "0307" : ["DS", "DistanceSourceToSupport"],
        "030E" : ["SQ", "ExposureDoseSequence"],
        "0310" : ["ST", "CommentsOnRadiationDose"],
        "0312" : ["DS", "XRayOutput"],
        "0314" : ["DS", "HalfValueLayer"],
        "0316" : ["DS", "OrganDose"],
        "0318" : ["CS", "OrganExposed"],
        "0320" : ["SQ", "BillingProcedureStepSequence"],
        "0321" : ["SQ", "FilmConsumptionSequence"],
        "0324" : ["SQ", "BillingSuppliesAndDevicesSequence"],
        "0330" : ["SQ", "ReferencedProcedureStepSequence"],
        "0340" : ["SQ", "PerformedSeriesSequence"],
        "0400" : ["LT", "CommentsOnTheScheduledProcedureStep"],
        "0440" : ["SQ", "ProtocolContextSequence"],
        "0441" : ["SQ", "ContentItemModifierSequence"],
        "0500" : ["SQ", "ScheduledSpecimenSequence"],
        "050A" : ["LO", "SpecimenAccessionNumber"],
        "0512" : ["LO", "ContainerIdentifier"],
        "0513" : ["SQ", "IssuerOfTheContainerIdentifierSequence"],
        "0515" : ["SQ", "AlternateContainerIdentifierSequence"],
        "0518" : ["SQ", "ContainerTypeCodeSequence"],
        "051A" : ["LO", "ContainerDescription"],
        "0520" : ["SQ", "ContainerComponentSequence"],
        "0550" : ["SQ", "SpecimenSequence"],
        "0551" : ["LO", "SpecimenIdentifier"],
        "0552" : ["SQ", "SpecimenDescriptionSequenceTrial"],
        "0553" : ["ST", "SpecimenDescriptionTrial"],
        "0554" : ["UI", "SpecimenUID"],
        "0555" : ["SQ", "AcquisitionContextSequence"],
        "0556" : ["ST", "AcquisitionContextDescription"],
        "059A" : ["SQ", "SpecimenTypeCodeSequence"],
        "0560" : ["SQ", "SpecimenDescriptionSequence"],
        "0562" : ["SQ", "IssuerOfTheSpecimenIdentifierSequence"],
        "0600" : ["LO", "SpecimenShortDescription"],
        "0602" : ["UT", "SpecimenDetailedDescription"],
        "0610" : ["SQ", "SpecimenPreparationSequence"],
        "0612" : ["SQ", "SpecimenPreparationStepContentItemSequence"],
        "0620" : ["SQ", "SpecimenLocalizationContentItemSequence"],
        "06FA" : ["LO", "SlideIdentifier"],
        "071A" : ["SQ", "ImageCenterPointCoordinatesSequence"],
        "072A" : ["DS", "XOffsetInSlideCoordinateSystem"],
        "073A" : ["DS", "YOffsetInSlideCoordinateSystem"],
        "074A" : ["DS", "ZOffsetInSlideCoordinateSystem"],
        "08D8" : ["SQ", "PixelSpacingSequence"],
        "08DA" : ["SQ", "CoordinateSystemAxisCodeSequence"],
        "08EA" : ["SQ", "MeasurementUnitsCodeSequence"],
        "09F8" : ["SQ", "VitalStainCodeSequenceTrial"],
        "1001" : ["SH", "RequestedProcedureID"],
        "1002" : ["LO", "ReasonForTheRequestedProcedure"],
        "1003" : ["SH", "RequestedProcedurePriority"],
        "1004" : ["LO", "PatientTransportArrangements"],
        "1005" : ["LO", "RequestedProcedureLocation"],
        "1006" : ["SH", "PlacerOrderNumberProcedure"],
        "1007" : ["SH", "FillerOrderNumberProcedure"],
        "1008" : ["LO", "ConfidentialityCode"],
        "1009" : ["SH", "ReportingPriority"],
        "100A" : ["SQ", "ReasonForRequestedProcedureCodeSequence"],
        "1010" : ["PN", "NamesOfIntendedRecipientsOfResults"],
        "1011" : ["SQ", "IntendedRecipientsOfResultsIdentificationSequence"],
        "1012" : ["SQ", "ReasonForPerformedProcedureCodeSequence"],
        "1060" : ["LO", "RequestedProcedureDescriptionTrial"],
        "1101" : ["SQ", "PersonIdentificationCodeSequence"],
        "1102" : ["ST", "PersonAddress"],
        "1103" : ["LO", "PersonTelephoneNumbers"],
        "1400" : ["LT", "RequestedProcedureComments"],
        "2001" : ["LO", "ReasonForTheImagingServiceRequest"],
        "2004" : ["DA", "IssueDateOfImagingServiceRequest"],
        "2005" : ["TM", "IssueTimeOfImagingServiceRequest"],
        "2006" : ["SH", "PlacerOrderNumberImagingServiceRequestRetired"],
        "2007" : ["SH", "FillerOrderNumberImagingServiceRequestRetired"],
        "2008" : ["PN", "OrderEnteredBy"],
        "2009" : ["SH", "OrderEntererLocation"],
        "2010" : ["SH", "OrderCallbackPhoneNumber"],
        "2016" : ["LO", "PlacerOrderNumberImagingServiceRequest"],
        "2017" : ["LO", "FillerOrderNumberImagingServiceRequest"],
        "2400" : ["LT", "ImagingServiceRequestComments"],
        "3001" : ["LO", "ConfidentialityConstraintOnPatientDataDescription"],
        "4001" : ["CS", "GeneralPurposeScheduledProcedureStepStatus"],
        "4002" : ["CS", "GeneralPurposePerformedProcedureStepStatus"],
        "4003" : ["CS", "GeneralPurposeScheduledProcedureStepPriority"],
        "4004" : ["SQ", "ScheduledProcessingApplicationsCodeSequence"],
        "4005" : ["DT", "ScheduledProcedureStepStartDateTime"],
        "4006" : ["CS", "MultipleCopiesFlag"],
        "4007" : ["SQ", "PerformedProcessingApplicationsCodeSequence"],
        "4009" : ["SQ", "HumanPerformerCodeSequence"],
        "4010" : ["DT", "ScheduledProcedureStepModificationDateTime"],
        "4011" : ["DT", "ExpectedCompletionDateTime"],
        "4015" : ["SQ", "ResultingGeneralPurposePerformedProcedureStepsSequence"],
        "4016" : ["SQ", "ReferencedGeneralPurposeScheduledProcedureStepSequence"],
        "4018" : ["SQ", "ScheduledWorkitemCodeSequence"],
        "4019" : ["SQ", "PerformedWorkitemCodeSequence"],
        "4020" : ["CS", "InputAvailabilityFlag"],
        "4021" : ["SQ", "InputInformationSequence"],
        "4022" : ["SQ", "RelevantInformationSequence"],
        "4023" : ["UI", "ReferencedGeneralPurposeScheduledProcedureStepTransactionUID"],
        "4025" : ["SQ", "ScheduledStationNameCodeSequence"],
        "4026" : ["SQ", "ScheduledStationClassCodeSequence"],
        "4027" : ["SQ", "ScheduledStationGeographicLocationCodeSequence"],
        "4028" : ["SQ", "PerformedStationNameCodeSequence"],
        "4029" : ["SQ", "PerformedStationClassCodeSequence"],
        "4030" : ["SQ", "PerformedStationGeographicLocationCodeSequence"],
        "4031" : ["SQ", "RequestedSubsequentWorkitemCodeSequence"],
        "4032" : ["SQ", "NonDICOMOutputCodeSequence"],
        "4033" : ["SQ", "OutputInformationSequence"],
        "4034" : ["SQ", "ScheduledHumanPerformersSequence"],
        "4035" : ["SQ", "ActualHumanPerformersSequence"],
        "4036" : ["LO", "HumanPerformerOrganization"],
        "4037" : ["PN", "HumanPerformerName"],
        "4040" : ["CS", "RawDataHandling"],
        "4041" : ["CS", "InputReadinessState"],
        "4050" : ["DT", "PerformedProcedureStepStartDateTime"],
        "4051" : ["DT", "PerformedProcedureStepEndDateTime"],
        "4052" : ["DT", "ProcedureStepCancellationDateTime"],
        "8302" : ["DS", "EntranceDoseInmGy"],
        "9094" : ["SQ", "ReferencedImageRealWorldValueMappingSequence"],
        "9096" : ["SQ", "RealWorldValueMappingSequence"],
        "9098" : ["SQ", "PixelValueMappingCodeSequence"],
        "9210" : ["SH", "LUTLabel"],
        "9211" : ["SS", "RealWorldValueLastValueMapped"],
        "9212" : ["FD", "RealWorldValueLUTData"],
        "9216" : ["SS", "RealWorldValueFirstValueMapped"],
        "9224" : ["FD", "RealWorldValueIntercept"],
        "9225" : ["FD", "RealWorldValueSlope"],
        "A007" : ["CS", "FindingsFlagTrial"],
        "A010" : ["CS", "RelationshipType"],
        "A020" : ["SQ", "FindingsSequenceTrial"],
        "A021" : ["UI", "FindingsGroupUIDTrial"],
        "A022" : ["UI", "ReferencedFindingsGroupUIDTrial"],
        "A023" : ["DA", "FindingsGroupRecordingDateTrial"],
        "A024" : ["TM", "FindingsGroupRecordingTimeTrial"],
        "A026" : ["SQ", "FindingsSourceCategoryCodeSequenceTrial"],
        "A027" : ["LO", "VerifyingOrganization"],
        "A028" : ["SQ", "DocumentingOrganizationIdentifierCodeSequenceTrial"],
        "A030" : ["DT", "VerificationDateTime"],
        "A032" : ["DT", "ObservationDateTime"],
        "A040" : ["CS", "ValueType"],
        "A043" : ["SQ", "ConceptNameCodeSequence"],
        "A047" : ["LO", "MeasurementPrecisionDescriptionTrial"],
        "A050" : ["CS", "ContinuityOfContent"],
        "A057" : ["CS", "UrgencyOrPriorityAlertsTrial"],
        "A060" : ["LO", "SequencingIndicatorTrial"],
        "A066" : ["SQ", "DocumentIdentifierCodeSequenceTrial"],
        "A067" : ["PN", "DocumentAuthorTrial"],
        "A068" : ["SQ", "DocumentAuthorIdentifierCodeSequenceTrial"],
        "A070" : ["SQ", "IdentifierCodeSequenceTrial"],
        "A073" : ["SQ", "VerifyingObserverSequence"],
        "A074" : ["OB", "ObjectBinaryIdentifierTrial"],
        "A075" : ["PN", "VerifyingObserverName"],
        "A076" : ["SQ", "DocumentingObserverIdentifierCodeSequenceTrial"],
        "A078" : ["SQ", "AuthorObserverSequence"],
        "A07A" : ["SQ", "ParticipantSequence"],
        "A07C" : ["SQ", "CustodialOrganizationSequence"],
        "A080" : ["CS", "ParticipationType"],
        "A082" : ["DT", "ParticipationDateTime"],
        "A084" : ["CS", "ObserverType"],
        "A085" : ["SQ", "ProcedureIdentifierCodeSequenceTrial"],
        "A088" : ["SQ", "VerifyingObserverIdentificationCodeSequence"],
        "A089" : ["OB", "ObjectDirectoryBinaryIdentifierTrial"],
        "A090" : ["SQ", "EquivalentCDADocumentSequence"],
        "A0B0" : ["US", "ReferencedWaveformChannels"],
        "A110" : ["DA", "DateOfDocumentOrVerbalTransactionTrial"],
        "A112" : ["TM", "TimeOfDocumentCreationOrVerbalTransactionTrial"],
        "A120" : ["DT", "DateTime"],
        "A121" : ["DA", "Date"],
        "A122" : ["TM", "Time"],
        "A123" : ["PN", "PersonName"],
        "A124" : ["UI", "UID"],
        "A125" : ["CS", "ReportStatusIDTrial"],
        "A130" : ["CS", "TemporalRangeType"],
        "A132" : ["UL", "ReferencedSamplePositions"],
        "A136" : ["US", "ReferencedFrameNumbers"],
        "A138" : ["DS", "ReferencedTimeOffsets"],
        "A13A" : ["DT", "ReferencedDateTime"],
        "A160" : ["UT", "TextValue"],
        "A167" : ["SQ", "ObservationCategoryCodeSequenceTrial"],
        "A168" : ["SQ", "ConceptCodeSequence"],
        "A16A" : ["ST", "BibliographicCitationTrial"],
        "A170" : ["SQ", "PurposeOfReferenceCodeSequence"],
        "A171" : ["UI", "ObservationUIDTrial"],
        "A172" : ["UI", "ReferencedObservationUIDTrial"],
        "A173" : ["CS", "ReferencedObservationClassTrial"],
        "A174" : ["CS", "ReferencedObjectObservationClassTrial"],
        "A180" : ["US", "AnnotationGroupNumber"],
        "A192" : ["DA", "ObservationDateTrial"],
        "A193" : ["TM", "ObservationTimeTrial"],
        "A194" : ["CS", "MeasurementAutomationTrial"],
        "A195" : ["SQ", "ModifierCodeSequence"],
        "A224" : ["ST", "IdentificationDescriptionTrial"],
        "A290" : ["CS", "CoordinatesSetGeometricTypeTrial"],
        "A296" : ["SQ", "AlgorithmCodeSequenceTrial"],
        "A297" : ["ST", "AlgorithmDescriptionTrial"],
        "A29A" : ["SL", "PixelCoordinatesSetTrial"],
        "A300" : ["SQ", "MeasuredValueSequence"],
        "A301" : ["SQ", "NumericValueQualifierCodeSequence"],
        "A307" : ["PN", "CurrentObserverTrial"],
        "A30A" : ["DS", "NumericValue"],
        "A313" : ["SQ", "ReferencedAccessionSequenceTrial"],
        "A33A" : ["ST", "ReportStatusCommentTrial"],
        "A340" : ["SQ", "ProcedureContextSequenceTrial"],
        "A352" : ["PN", "VerbalSourceTrial"],
        "A353" : ["ST", "AddressTrial"],
        "A354" : ["LO", "TelephoneNumberTrial"],
        "A358" : ["SQ", "VerbalSourceIdentifierCodeSequenceTrial"],
        "A360" : ["SQ", "PredecessorDocumentsSequence"],
        "A370" : ["SQ", "ReferencedRequestSequence"],
        "A372" : ["SQ", "PerformedProcedureCodeSequence"],
        "A375" : ["SQ", "CurrentRequestedProcedureEvidenceSequence"],
        "A380" : ["SQ", "ReportDetailSequenceTrial"],
        "A385" : ["SQ", "PertinentOtherEvidenceSequence"],
        "A390" : ["SQ", "HL7StructuredDocumentReferenceSequence"],
        "A402" : ["UI", "ObservationSubjectUIDTrial"],
        "A403" : ["CS", "ObservationSubjectClassTrial"],
        "A404" : ["SQ", "ObservationSubjectTypeCodeSequenceTrial"],
        "A491" : ["CS", "CompletionFlag"],
        "A492" : ["LO", "CompletionFlagDescription"],
        "A493" : ["CS", "VerificationFlag"],
        "A494" : ["CS", "ArchiveRequested"],
        "A496" : ["CS", "PreliminaryFlag"],
        "A504" : ["SQ", "ContentTemplateSequence"],
        "A525" : ["SQ", "IdenticalDocumentsSequence"],
        "A600" : ["CS", "ObservationSubjectContextFlagTrial"],
        "A601" : ["CS", "ObserverContextFlagTrial"],
        "A603" : ["CS", "ProcedureContextFlagTrial"],
        "A730" : ["SQ", "ContentSequence"],
        "A731" : ["SQ", "RelationshipSequenceTrial"],
        "A732" : ["SQ", "RelationshipTypeCodeSequenceTrial"],
        "A744" : ["SQ", "LanguageCodeSequenceTrial"],
        "A992" : ["ST", "UniformResourceLocatorTrial"],
        "B020" : ["SQ", "WaveformAnnotationSequence"],
        "DB00" : ["CS", "TemplateIdentifier"],
        "DB06" : ["DT", "TemplateVersion"],
        "DB07" : ["DT", "TemplateLocalVersion"],
        "DB0B" : ["CS", "TemplateExtensionFlag"],
        "DB0C" : ["UI", "TemplateExtensionOrganizationUID"],
        "DB0D" : ["UI", "TemplateExtensionCreatorUID"],
        "DB73" : ["UL", "ReferencedContentItemIdentifier"],
        "E001" : ["ST", "HL7InstanceIdentifier"],
        "E004" : ["DT", "HL7DocumentEffectiveTime"],
        "E006" : ["SQ", "HL7DocumentTypeCodeSequence"],
        "E008" : ["SQ", "DocumentClassCodeSequence"],
        "E010" : ["UT", "RetrieveURI"],
        "E011" : ["UI", "RetrieveLocationUID"],
        "E020" : ["CS", "TypeOfInstances"],
        "E021" : ["SQ", "DICOMRetrievalSequence"],
        "E022" : ["SQ", "DICOMMediaRetrievalSequence"],
        "E023" : ["SQ", "WADORetrievalSequence"],
        "E024" : ["SQ", "XDSRetrievalSequence"],
        "E030" : ["UI", "RepositoryUniqueID"],
        "E031" : ["UI", "HomeCommunityID"]
    },
    "0042" : {
        "0010" : ["ST", "DocumentTitle"],
        "0011" : ["OB", "EncapsulatedDocument"],
        "0012" : ["LO", "MIMETypeOfEncapsulatedDocument"],
        "0013" : ["SQ", "SourceInstanceSequence"],
        "0014" : ["LO", "ListOfMIMETypes"]
    },
    "0044" : {
        "0001" : ["ST", "ProductPackageIdentifier"],
        "0002" : ["CS", "SubstanceAdministrationApproval"],
        "0003" : ["LT", "ApprovalStatusFurtherDescription"],
        "0004" : ["DT", "ApprovalStatusDateTime"],
        "0007" : ["SQ", "ProductTypeCodeSequence"],
        "0008" : ["LO", "ProductName"],
        "0009" : ["LT", "ProductDescription"],
        "000A" : ["LO", "ProductLotIdentifier"],
        "000B" : ["DT", "ProductExpirationDateTime"],
        "0010" : ["DT", "SubstanceAdministrationDateTime"],
        "0011" : ["LO", "SubstanceAdministrationNotes"],
        "0012" : ["LO", "SubstanceAdministrationDeviceID"],
        "0013" : ["SQ", "ProductParameterSequence"],
        "0019" : ["SQ", "SubstanceAdministrationParameterSequence"]
    },
    "0046" : {
        "0012" : ["LO", "LensDescription"],
        "0014" : ["SQ", "RightLensSequence"],
        "0015" : ["SQ", "LeftLensSequence"],
        "0016" : ["SQ", "UnspecifiedLateralityLensSequence"],
        "0018" : ["SQ", "CylinderSequence"],
        "0028" : ["SQ", "PrismSequence"],
        "0030" : ["FD", "HorizontalPrismPower"],
        "0032" : ["CS", "HorizontalPrismBase"],
        "0034" : ["FD", "VerticalPrismPower"],
        "0036" : ["CS", "VerticalPrismBase"],
        "0038" : ["CS", "LensSegmentType"],
        "0040" : ["FD", "OpticalTransmittance"],
        "0042" : ["FD", "ChannelWidth"],
        "0044" : ["FD", "PupilSize"],
        "0046" : ["FD", "CornealSize"],
        "0050" : ["SQ", "AutorefractionRightEyeSequence"],
        "0052" : ["SQ", "AutorefractionLeftEyeSequence"],
        "0060" : ["FD", "DistancePupillaryDistance"],
        "0062" : ["FD", "NearPupillaryDistance"],
        "0063" : ["FD", "IntermediatePupillaryDistance"],
        "0064" : ["FD", "OtherPupillaryDistance"],
        "0070" : ["SQ", "KeratometryRightEyeSequence"],
        "0071" : ["SQ", "KeratometryLeftEyeSequence"],
        "0074" : ["SQ", "SteepKeratometricAxisSequence"],
        "0075" : ["FD", "RadiusOfCurvature"],
        "0076" : ["FD", "KeratometricPower"],
        "0077" : ["FD", "KeratometricAxis"],
        "0080" : ["SQ", "FlatKeratometricAxisSequence"],
        "0092" : ["CS", "BackgroundColor"],
        "0094" : ["CS", "Optotype"],
        "0095" : ["CS", "OptotypePresentation"],
        "0097" : ["SQ", "SubjectiveRefractionRightEyeSequence"],
        "0098" : ["SQ", "SubjectiveRefractionLeftEyeSequence"],
        "0100" : ["SQ", "AddNearSequence"],
        "0101" : ["SQ", "AddIntermediateSequence"],
        "0102" : ["SQ", "AddOtherSequence"],
        "0104" : ["FD", "AddPower"],
        "0106" : ["FD", "ViewingDistance"],
        "0121" : ["SQ", "VisualAcuityTypeCodeSequence"],
        "0122" : ["SQ", "VisualAcuityRightEyeSequence"],
        "0123" : ["SQ", "VisualAcuityLeftEyeSequence"],
        "0124" : ["SQ", "VisualAcuityBothEyesOpenSequence"],
        "0125" : ["CS", "ViewingDistanceType"],
        "0135" : ["SS", "VisualAcuityModifiers"],
        "0137" : ["FD", "DecimalVisualAcuity"],
        "0139" : ["LO", "OptotypeDetailedDefinition"],
        "0145" : ["SQ", "ReferencedRefractiveMeasurementsSequence"],
        "0146" : ["FD", "SpherePower"],
        "0147" : ["FD", "CylinderPower"]
    },
    "0048" : {
        "0001" : ["FL", "ImagedVolumeWidth"],
        "0002" : ["FL", "ImagedVolumeHeight"],
        "0003" : ["FL", "ImagedVolumeDepth"],
        "0006" : ["UL", "TotalPixelMatrixColumns"],
        "0007" : ["UL", "TotalPixelMatrixRows"],
        "0008" : ["SQ", "TotalPixelMatrixOriginSequence"],
        "0010" : ["CS", "SpecimenLabelInImage"],
        "0011" : ["CS", "FocusMethod"],
        "0012" : ["CS", "ExtendedDepthOfField"],
        "0013" : ["US", "NumberOfFocalPlanes"],
        "0014" : ["FL", "DistanceBetweenFocalPlanes"],
        "0015" : ["US", "RecommendedAbsentPixelCIELabValue"],
        "0100" : ["SQ", "IlluminatorTypeCodeSequence"],
        "0102" : ["DS", "ImageOrientationSlide"],
        "0105" : ["SQ", "OpticalPathSequence"],
        "0106" : ["SH", "OpticalPathIdentifier"],
        "0107" : ["ST", "OpticalPathDescription"],
        "0108" : ["SQ", "IlluminationColorCodeSequence"],
        "0110" : ["SQ", "SpecimenReferenceSequence"],
        "0111" : ["DS", "CondenserLensPower"],
        "0112" : ["DS", "ObjectiveLensPower"],
        "0113" : ["DS", "ObjectiveLensNumericalAperture"],
        "0120" : ["SQ", "PaletteColorLookupTableSequence"],
        "0200" : ["SQ", "ReferencedImageNavigationSequence"],
        "0201" : ["US", "TopLeftHandCornerOfLocalizerArea"],
        "0202" : ["US", "BottomRightHandCornerOfLocalizerArea"],
        "0207" : ["SQ", "OpticalPathIdentificationSequence"],
        "021A" : ["SQ", "PlanePositionSlideSequence"],
        "021E" : ["SL", "RowPositionInTotalImagePixelMatrix"],
        "021F" : ["SL", "ColumnPositionInTotalImagePixelMatrix"],
        "0301" : ["CS", "PixelOriginInterpretation"]
    },
    "0050" : {
        "0004" : ["CS", "CalibrationImage"],
        "0010" : ["SQ", "DeviceSequence"],
        "0012" : ["SQ", "ContainerComponentTypeCodeSequence"],
        "0013" : ["FD", "ContainerComponentThickness"],
        "0014" : ["DS", "DeviceLength"],
        "0015" : ["FD", "ContainerComponentWidth"],
        "0016" : ["DS", "DeviceDiameter"],
        "0017" : ["CS", "DeviceDiameterUnits"],
        "0018" : ["DS", "DeviceVolume"],
        "0019" : ["DS", "InterMarkerDistance"],
        "001A" : ["CS", "ContainerComponentMaterial"],
        "001B" : ["LO", "ContainerComponentID"],
        "001C" : ["FD", "ContainerComponentLength"],
        "001D" : ["FD", "ContainerComponentDiameter"],
        "001E" : ["LO", "ContainerComponentDescription"],
        "0020" : ["LO", "DeviceDescription"]
    },
    "0052" : {
        "0001" : ["FL", "ContrastBolusIngredientPercentByVolume"],
        "0002" : ["FD", "OCTFocalDistance"],
        "0003" : ["FD", "BeamSpotSize"],
        "0004" : ["FD", "EffectiveRefractiveIndex"],
        "0006" : ["CS", "OCTAcquisitionDomain"],
        "0007" : ["FD", "OCTOpticalCenterWavelength"],
        "0008" : ["FD", "AxialResolution"],
        "0009" : ["FD", "RangingDepth"],
        "0011" : ["FD", "ALineRate"],
        "0012" : ["US", "ALinesPerFrame"],
        "0013" : ["FD", "CatheterRotationalRate"],
        "0014" : ["FD", "ALinePixelSpacing"],
        "0016" : ["SQ", "ModeOfPercutaneousAccessSequence"],
        "0025" : ["SQ", "IntravascularOCTFrameTypeSequence"],
        "0026" : ["CS", "OCTZOffsetApplied"],
        "0027" : ["SQ", "IntravascularFrameContentSequence"],
        "0028" : ["FD", "IntravascularLongitudinalDistance"],
        "0029" : ["SQ", "IntravascularOCTFrameContentSequence"],
        "0030" : ["SS", "OCTZOffsetCorrection"],
        "0031" : ["CS", "CatheterDirectionOfRotation"],
        "0033" : ["FD", "SeamLineLocation"],
        "0034" : ["FD", "FirstALineLocation"],
        "0036" : ["US", "SeamLineIndex"],
        "0038" : ["US", "NumberOfPaddedAlines"],
        "0039" : ["CS", "InterpolationType"],
        "003A" : ["CS", "RefractiveIndexApplied"]
    },
    "0054" : {
        "0010" : ["US", "EnergyWindowVector"],
        "0011" : ["US", "NumberOfEnergyWindows"],
        "0012" : ["SQ", "EnergyWindowInformationSequence"],
        "0013" : ["SQ", "EnergyWindowRangeSequence"],
        "0014" : ["DS", "EnergyWindowLowerLimit"],
        "0015" : ["DS", "EnergyWindowUpperLimit"],
        "0016" : ["SQ", "RadiopharmaceuticalInformationSequence"],
        "0017" : ["IS", "ResidualSyringeCounts"],
        "0018" : ["SH", "EnergyWindowName"],
        "0020" : ["US", "DetectorVector"],
        "0021" : ["US", "NumberOfDetectors"],
        "0022" : ["SQ", "DetectorInformationSequence"],
        "0030" : ["US", "PhaseVector"],
        "0031" : ["US", "NumberOfPhases"],
        "0032" : ["SQ", "PhaseInformationSequence"],
        "0033" : ["US", "NumberOfFramesInPhase"],
        "0036" : ["IS", "PhaseDelay"],
        "0038" : ["IS", "PauseBetweenFrames"],
        "0039" : ["CS", "PhaseDescription"],
        "0050" : ["US", "RotationVector"],
        "0051" : ["US", "NumberOfRotations"],
        "0052" : ["SQ", "RotationInformationSequence"],
        "0053" : ["US", "NumberOfFramesInRotation"],
        "0060" : ["US", "RRIntervalVector"],
        "0061" : ["US", "NumberOfRRIntervals"],
        "0062" : ["SQ", "GatedInformationSequence"],
        "0063" : ["SQ", "DataInformationSequence"],
        "0070" : ["US", "TimeSlotVector"],
        "0071" : ["US", "NumberOfTimeSlots"],
        "0072" : ["SQ", "TimeSlotInformationSequence"],
        "0073" : ["DS", "TimeSlotTime"],
        "0080" : ["US", "SliceVector"],
        "0081" : ["US", "NumberOfSlices"],
        "0090" : ["US", "AngularViewVector"],
        "0100" : ["US", "TimeSliceVector"],
        "0101" : ["US", "NumberOfTimeSlices"],
        "0200" : ["DS", "StartAngle"],
        "0202" : ["CS", "TypeOfDetectorMotion"],
        "0210" : ["IS", "TriggerVector"],
        "0211" : ["US", "NumberOfTriggersInPhase"],
        "0220" : ["SQ", "ViewCodeSequence"],
        "0222" : ["SQ", "ViewModifierCodeSequence"],
        "0300" : ["SQ", "RadionuclideCodeSequence"],
        "0302" : ["SQ", "AdministrationRouteCodeSequence"],
        "0304" : ["SQ", "RadiopharmaceuticalCodeSequence"],
        "0306" : ["SQ", "CalibrationDataSequence"],
        "0308" : ["US", "EnergyWindowNumber"],
        "0400" : ["SH", "ImageID"],
        "0410" : ["SQ", "PatientOrientationCodeSequence"],
        "0412" : ["SQ", "PatientOrientationModifierCodeSequence"],
        "0414" : ["SQ", "PatientGantryRelationshipCodeSequence"],
        "0500" : ["CS", "SliceProgressionDirection"],
        "1000" : ["CS", "SeriesType"],
        "1001" : ["CS", "Units"],
        "1002" : ["CS", "CountsSource"],
        "1004" : ["CS", "ReprojectionMethod"],
        "1006" : ["CS", "SUVType"],
        "1100" : ["CS", "RandomsCorrectionMethod"],
        "1101" : ["LO", "AttenuationCorrectionMethod"],
        "1102" : ["CS", "DecayCorrection"],
        "1103" : ["LO", "ReconstructionMethod"],
        "1104" : ["LO", "DetectorLinesOfResponseUsed"],
        "1105" : ["LO", "ScatterCorrectionMethod"],
        "1200" : ["DS", "AxialAcceptance"],
        "1201" : ["IS", "AxialMash"],
        "1202" : ["IS", "TransverseMash"],
        "1203" : ["DS", "DetectorElementSize"],
        "1210" : ["DS", "CoincidenceWindowWidth"],
        "1220" : ["CS", "SecondaryCountsType"],
        "1300" : ["DS", "FrameReferenceTime"],
        "1310" : ["IS", "PrimaryPromptsCountsAccumulated"],
        "1311" : ["IS", "SecondaryCountsAccumulated"],
        "1320" : ["DS", "SliceSensitivityFactor"],
        "1321" : ["DS", "DecayFactor"],
        "1322" : ["DS", "DoseCalibrationFactor"],
        "1323" : ["DS", "ScatterFractionFactor"],
        "1324" : ["DS", "DeadTimeFactor"],
        "1330" : ["US", "ImageIndex"],
        "1400" : ["CS", "CountsIncluded"],
        "1401" : ["CS", "DeadTimeCorrectionFlag"]
    },
    "0060" : {
        "3000" : ["SQ", "HistogramSequence"],
        "3002" : ["US", "HistogramNumberOfBins"],
        "3004" : ["SS", "HistogramFirstBinValue"],
        "3006" : ["SS", "HistogramLastBinValue"],
        "3008" : ["US", "HistogramBinWidth"],
        "3010" : ["LO", "HistogramExplanation"],
        "3020" : ["UL", "HistogramData"]
    },
    "0062" : {
        "0001" : ["CS", "SegmentationType"],
        "0002" : ["SQ", "SegmentSequence"],
        "0003" : ["SQ", "SegmentedPropertyCategoryCodeSequence"],
        "0004" : ["US", "SegmentNumber"],
        "0005" : ["LO", "SegmentLabel"],
        "0006" : ["ST", "SegmentDescription"],
        "0008" : ["CS", "SegmentAlgorithmType"],
        "0009" : ["LO", "SegmentAlgorithmName"],
        "000A" : ["SQ", "SegmentIdentificationSequence"],
        "000B" : ["US", "ReferencedSegmentNumber"],
        "000C" : ["US", "RecommendedDisplayGrayscaleValue"],
        "000D" : ["US", "RecommendedDisplayCIELabValue"],
        "000E" : ["US", "MaximumFractionalValue"],
        "000F" : ["SQ", "SegmentedPropertyTypeCodeSequence"],
        "0010" : ["CS", "SegmentationFractionalType"]
    },
    "0064" : {
        "0002" : ["SQ", "DeformableRegistrationSequence"],
        "0003" : ["UI", "SourceFrameOfReferenceUID"],
        "0005" : ["SQ", "DeformableRegistrationGridSequence"],
        "0007" : ["UL", "GridDimensions"],
        "0008" : ["FD", "GridResolution"],
        "0009" : ["OF", "VectorGridData"],
        "000F" : ["SQ", "PreDeformationMatrixRegistrationSequence"],
        "0010" : ["SQ", "PostDeformationMatrixRegistrationSequence"]
    },
    "0066" : {
        "0001" : ["UL", "NumberOfSurfaces"],
        "0002" : ["SQ", "SurfaceSequence"],
        "0003" : ["UL", "SurfaceNumber"],
        "0004" : ["LT", "SurfaceComments"],
        "0009" : ["CS", "SurfaceProcessing"],
        "000A" : ["FL", "SurfaceProcessingRatio"],
        "000B" : ["LO", "SurfaceProcessingDescription"],
        "000C" : ["FL", "RecommendedPresentationOpacity"],
        "000D" : ["CS", "RecommendedPresentationType"],
        "000E" : ["CS", "FiniteVolume"],
        "0010" : ["CS", "Manifold"],
        "0011" : ["SQ", "SurfacePointsSequence"],
        "0012" : ["SQ", "SurfacePointsNormalsSequence"],
        "0013" : ["SQ", "SurfaceMeshPrimitivesSequence"],
        "0015" : ["UL", "NumberOfSurfacePoints"],
        "0016" : ["OF", "PointCoordinatesData"],
        "0017" : ["FL", "PointPositionAccuracy"],
        "0018" : ["FL", "MeanPointDistance"],
        "0019" : ["FL", "MaximumPointDistance"],
        "001A" : ["FL", "PointsBoundingBoxCoordinates"],
        "001B" : ["FL", "AxisOfRotation"],
        "001C" : ["FL", "CenterOfRotation"],
        "001E" : ["UL", "NumberOfVectors"],
        "001F" : ["US", "VectorDimensionality"],
        "0020" : ["FL", "VectorAccuracy"],
        "0021" : ["OF", "VectorCoordinateData"],
        "0023" : ["OW", "TrianglePointIndexList"],
        "0024" : ["OW", "EdgePointIndexList"],
        "0025" : ["OW", "VertexPointIndexList"],
        "0026" : ["SQ", "TriangleStripSequence"],
        "0027" : ["SQ", "TriangleFanSequence"],
        "0028" : ["SQ", "LineSequence"],
        "0029" : ["OW", "PrimitivePointIndexList"],
        "002A" : ["UL", "SurfaceCount"],
        "002B" : ["SQ", "ReferencedSurfaceSequence"],
        "002C" : ["UL", "ReferencedSurfaceNumber"],
        "002D" : ["SQ", "SegmentSurfaceGenerationAlgorithmIdentificationSequence"],
        "002E" : ["SQ", "SegmentSurfaceSourceInstanceSequence"],
        "002F" : ["SQ", "AlgorithmFamilyCodeSequence"],
        "0030" : ["SQ", "AlgorithmNameCodeSequence"],
        "0031" : ["LO", "AlgorithmVersion"],
        "0032" : ["LT", "AlgorithmParameters"],
        "0034" : ["SQ", "FacetSequence"],
        "0035" : ["SQ", "SurfaceProcessingAlgorithmIdentificationSequence"],
        "0036" : ["LO", "AlgorithmName"]
    },
    "0068" : {
        "6210" : ["LO", "ImplantSize"],
        "6221" : ["LO", "ImplantTemplateVersion"],
        "6222" : ["SQ", "ReplacedImplantTemplateSequence"],
        "6223" : ["CS", "ImplantType"],
        "6224" : ["SQ", "DerivationImplantTemplateSequence"],
        "6225" : ["SQ", "OriginalImplantTemplateSequence"],
        "6226" : ["DT", "EffectiveDateTime"],
        "6230" : ["SQ", "ImplantTargetAnatomySequence"],
        "6260" : ["SQ", "InformationFromManufacturerSequence"],
        "6265" : ["SQ", "NotificationFromManufacturerSequence"],
        "6270" : ["DT", "InformationIssueDateTime"],
        "6280" : ["ST", "InformationSummary"],
        "62A0" : ["SQ", "ImplantRegulatoryDisapprovalCodeSequence"],
        "62A5" : ["FD", "OverallTemplateSpatialTolerance"],
        "62C0" : ["SQ", "HPGLDocumentSequence"],
        "62D0" : ["US", "HPGLDocumentID"],
        "62D5" : ["LO", "HPGLDocumentLabel"],
        "62E0" : ["SQ", "ViewOrientationCodeSequence"],
        "62F0" : ["FD", "ViewOrientationModifier"],
        "62F2" : ["FD", "HPGLDocumentScaling"],
        "6300" : ["OB", "HPGLDocument"],
        "6310" : ["US", "HPGLContourPenNumber"],
        "6320" : ["SQ", "HPGLPenSequence"],
        "6330" : ["US", "HPGLPenNumber"],
        "6340" : ["LO", "HPGLPenLabel"],
        "6345" : ["ST", "HPGLPenDescription"],
        "6346" : ["FD", "RecommendedRotationPoint"],
        "6347" : ["FD", "BoundingRectangle"],
        "6350" : ["US", "ImplantTemplate3DModelSurfaceNumber"],
        "6360" : ["SQ", "SurfaceModelDescriptionSequence"],
        "6380" : ["LO", "SurfaceModelLabel"],
        "6390" : ["FD", "SurfaceModelScalingFactor"],
        "63A0" : ["SQ", "MaterialsCodeSequence"],
        "63A4" : ["SQ", "CoatingMaterialsCodeSequence"],
        "63A8" : ["SQ", "ImplantTypeCodeSequence"],
        "63AC" : ["SQ", "FixationMethodCodeSequence"],
        "63B0" : ["SQ", "MatingFeatureSetsSequence"],
        "63C0" : ["US", "MatingFeatureSetID"],
        "63D0" : ["LO", "MatingFeatureSetLabel"],
        "63E0" : ["SQ", "MatingFeatureSequence"],
        "63F0" : ["US", "MatingFeatureID"],
        "6400" : ["SQ", "MatingFeatureDegreeOfFreedomSequence"],
        "6410" : ["US", "DegreeOfFreedomID"],
        "6420" : ["CS", "DegreeOfFreedomType"],
        "6430" : ["SQ", "TwoDMatingFeatureCoordinatesSequence"],
        "6440" : ["US", "ReferencedHPGLDocumentID"],
        "6450" : ["FD", "TwoDMatingPoint"],
        "6460" : ["FD", "TwoDMatingAxes"],
        "6470" : ["SQ", "TwoDDegreeOfFreedomSequence"],
        "6490" : ["FD", "ThreeDDegreeOfFreedomAxis"],
        "64A0" : ["FD", "RangeOfFreedom"],
        "64C0" : ["FD", "ThreeDMatingPoint"],
        "64D0" : ["FD", "ThreeDMatingAxes"],
        "64F0" : ["FD", "TwoDDegreeOfFreedomAxis"],
        "6500" : ["SQ", "PlanningLandmarkPointSequence"],
        "6510" : ["SQ", "PlanningLandmarkLineSequence"],
        "6520" : ["SQ", "PlanningLandmarkPlaneSequence"],
        "6530" : ["US", "PlanningLandmarkID"],
        "6540" : ["LO", "PlanningLandmarkDescription"],
        "6545" : ["SQ", "PlanningLandmarkIdentificationCodeSequence"],
        "6550" : ["SQ", "TwoDPointCoordinatesSequence"],
        "6560" : ["FD", "TwoDPointCoordinates"],
        "6590" : ["FD", "ThreeDPointCoordinates"],
        "65A0" : ["SQ", "TwoDLineCoordinatesSequence"],
        "65B0" : ["FD", "TwoDLineCoordinates"],
        "65D0" : ["FD", "ThreeDLineCoordinates"],
        "65E0" : ["SQ", "TwoDPlaneCoordinatesSequence"],
        "65F0" : ["FD", "TwoDPlaneIntersection"],
        "6610" : ["FD", "ThreeDPlaneOrigin"],
        "6620" : ["FD", "ThreeDPlaneNormal"]
    },
    "0070" : {
        "0001" : ["SQ", "GraphicAnnotationSequence"],
        "0002" : ["CS", "GraphicLayer"],
        "0003" : ["CS", "BoundingBoxAnnotationUnits"],
        "0004" : ["CS", "AnchorPointAnnotationUnits"],
        "0005" : ["CS", "GraphicAnnotationUnits"],
        "0006" : ["ST", "UnformattedTextValue"],
        "0008" : ["SQ", "TextObjectSequence"],
        "0009" : ["SQ", "GraphicObjectSequence"],
        "0010" : ["FL", "BoundingBoxTopLeftHandCorner"],
        "0011" : ["FL", "BoundingBoxBottomRightHandCorner"],
        "0012" : ["CS", "BoundingBoxTextHorizontalJustification"],
        "0014" : ["FL", "AnchorPoint"],
        "0015" : ["CS", "AnchorPointVisibility"],
        "0020" : ["US", "GraphicDimensions"],
        "0021" : ["US", "NumberOfGraphicPoints"],
        "0022" : ["FL", "GraphicData"],
        "0023" : ["CS", "GraphicType"],
        "0024" : ["CS", "GraphicFilled"],
        "0040" : ["IS", "ImageRotationRetired"],
        "0041" : ["CS", "ImageHorizontalFlip"],
        "0042" : ["US", "ImageRotation"],
        "0050" : ["US", "DisplayedAreaTopLeftHandCornerTrial"],
        "0051" : ["US", "DisplayedAreaBottomRightHandCornerTrial"],
        "0052" : ["SL", "DisplayedAreaTopLeftHandCorner"],
        "0053" : ["SL", "DisplayedAreaBottomRightHandCorner"],
        "005A" : ["SQ", "DisplayedAreaSelectionSequence"],
        "0060" : ["SQ", "GraphicLayerSequence"],
        "0062" : ["IS", "GraphicLayerOrder"],
        "0066" : ["US", "GraphicLayerRecommendedDisplayGrayscaleValue"],
        "0067" : ["US", "GraphicLayerRecommendedDisplayRGBValue"],
        "0068" : ["LO", "GraphicLayerDescription"],
        "0080" : ["CS", "ContentLabel"],
        "0081" : ["LO", "ContentDescription"],
        "0082" : ["DA", "PresentationCreationDate"],
        "0083" : ["TM", "PresentationCreationTime"],
        "0084" : ["PN", "ContentCreatorName"],
        "0086" : ["SQ", "ContentCreatorIdentificationCodeSequence"],
        "0087" : ["SQ", "AlternateContentDescriptionSequence"],
        "0100" : ["CS", "PresentationSizeMode"],
        "0101" : ["DS", "PresentationPixelSpacing"],
        "0102" : ["IS", "PresentationPixelAspectRatio"],
        "0103" : ["FL", "PresentationPixelMagnificationRatio"],
        "0207" : ["LO", "GraphicGroupLabel"],
        "0208" : ["ST", "GraphicGroupDescription"],
        "0209" : ["SQ", "CompoundGraphicSequence"],
        "0226" : ["UL", "CompoundGraphicInstanceID"],
        "0227" : ["LO", "FontName"],
        "0228" : ["CS", "FontNameType"],
        "0229" : ["LO", "CSSFontName"],
        "0230" : ["FD", "RotationAngle"],
        "0231" : ["SQ", "TextStyleSequence"],
        "0232" : ["SQ", "LineStyleSequence"],
        "0233" : ["SQ", "FillStyleSequence"],
        "0234" : ["SQ", "GraphicGroupSequence"],
        "0241" : ["US", "TextColorCIELabValue"],
        "0242" : ["CS", "HorizontalAlignment"],
        "0243" : ["CS", "VerticalAlignment"],
        "0244" : ["CS", "ShadowStyle"],
        "0245" : ["FL", "ShadowOffsetX"],
        "0246" : ["FL", "ShadowOffsetY"],
        "0247" : ["US", "ShadowColorCIELabValue"],
        "0248" : ["CS", "Underlined"],
        "0249" : ["CS", "Bold"],
        "0250" : ["CS", "Italic"],
        "0251" : ["US", "PatternOnColorCIELabValue"],
        "0252" : ["US", "PatternOffColorCIELabValue"],
        "0253" : ["FL", "LineThickness"],
        "0254" : ["CS", "LineDashingStyle"],
        "0255" : ["UL", "LinePattern"],
        "0256" : ["OB", "FillPattern"],
        "0257" : ["CS", "FillMode"],
        "0258" : ["FL", "ShadowOpacity"],
        "0261" : ["FL", "GapLength"],
        "0262" : ["FL", "DiameterOfVisibility"],
        "0273" : ["FL", "RotationPoint"],
        "0274" : ["CS", "TickAlignment"],
        "0278" : ["CS", "ShowTickLabel"],
        "0279" : ["CS", "TickLabelAlignment"],
        "0282" : ["CS", "CompoundGraphicUnits"],
        "0284" : ["FL", "PatternOnOpacity"],
        "0285" : ["FL", "PatternOffOpacity"],
        "0287" : ["SQ", "MajorTicksSequence"],
        "0288" : ["FL", "TickPosition"],
        "0289" : ["SH", "TickLabel"],
        "0294" : ["CS", "CompoundGraphicType"],
        "0295" : ["UL", "GraphicGroupID"],
        "0306" : ["CS", "ShapeType"],
        "0308" : ["SQ", "RegistrationSequence"],
        "0309" : ["SQ", "MatrixRegistrationSequence"],
        "030A" : ["SQ", "MatrixSequence"],
        "030C" : ["CS", "FrameOfReferenceTransformationMatrixType"],
        "030D" : ["SQ", "RegistrationTypeCodeSequence"],
        "030F" : ["ST", "FiducialDescription"],
        "0310" : ["SH", "FiducialIdentifier"],
        "0311" : ["SQ", "FiducialIdentifierCodeSequence"],
        "0312" : ["FD", "ContourUncertaintyRadius"],
        "0314" : ["SQ", "UsedFiducialsSequence"],
        "0318" : ["SQ", "GraphicCoordinatesDataSequence"],
        "031A" : ["UI", "FiducialUID"],
        "031C" : ["SQ", "FiducialSetSequence"],
        "031E" : ["SQ", "FiducialSequence"],
        "0401" : ["US", "GraphicLayerRecommendedDisplayCIELabValue"],
        "0402" : ["SQ", "BlendingSequence"],
        "0403" : ["FL", "RelativeOpacity"],
        "0404" : ["SQ", "ReferencedSpatialRegistrationSequence"],
        "0405" : ["CS", "BlendingPosition"]
    },
    "0072" : {
        "0002" : ["SH", "HangingProtocolName"],
        "0004" : ["LO", "HangingProtocolDescription"],
        "0006" : ["CS", "HangingProtocolLevel"],
        "0008" : ["LO", "HangingProtocolCreator"],
        "000A" : ["DT", "HangingProtocolCreationDateTime"],
        "000C" : ["SQ", "HangingProtocolDefinitionSequence"],
        "000E" : ["SQ", "HangingProtocolUserIdentificationCodeSequence"],
        "0010" : ["LO", "HangingProtocolUserGroupName"],
        "0012" : ["SQ", "SourceHangingProtocolSequence"],
        "0014" : ["US", "NumberOfPriorsReferenced"],
        "0020" : ["SQ", "ImageSetsSequence"],
        "0022" : ["SQ", "ImageSetSelectorSequence"],
        "0024" : ["CS", "ImageSetSelectorUsageFlag"],
        "0026" : ["AT", "SelectorAttribute"],
        "0028" : ["US", "SelectorValueNumber"],
        "0030" : ["SQ", "TimeBasedImageSetsSequence"],
        "0032" : ["US", "ImageSetNumber"],
        "0034" : ["CS", "ImageSetSelectorCategory"],
        "0038" : ["US", "RelativeTime"],
        "003A" : ["CS", "RelativeTimeUnits"],
        "003C" : ["SS", "AbstractPriorValue"],
        "003E" : ["SQ", "AbstractPriorCodeSequence"],
        "0040" : ["LO", "ImageSetLabel"],
        "0050" : ["CS", "SelectorAttributeVR"],
        "0052" : ["AT", "SelectorSequencePointer"],
        "0054" : ["LO", "SelectorSequencePointerPrivateCreator"],
        "0056" : ["LO", "SelectorAttributePrivateCreator"],
        "0060" : ["AT", "SelectorATValue"],
        "0062" : ["CS", "SelectorCSValue"],
        "0064" : ["IS", "SelectorISValue"],
        "0066" : ["LO", "SelectorLOValue"],
        "0068" : ["LT", "SelectorLTValue"],
        "006A" : ["PN", "SelectorPNValue"],
        "006C" : ["SH", "SelectorSHValue"],
        "006E" : ["ST", "SelectorSTValue"],
        "0070" : ["UT", "SelectorUTValue"],
        "0072" : ["DS", "SelectorDSValue"],
        "0074" : ["FD", "SelectorFDValue"],
        "0076" : ["FL", "SelectorFLValue"],
        "0078" : ["UL", "SelectorULValue"],
        "007A" : ["US", "SelectorUSValue"],
        "007C" : ["SL", "SelectorSLValue"],
        "007E" : ["SS", "SelectorSSValue"],
        "0080" : ["SQ", "SelectorCodeSequenceValue"],
        "0100" : ["US", "NumberOfScreens"],
        "0102" : ["SQ", "NominalScreenDefinitionSequence"],
        "0104" : ["US", "NumberOfVerticalPixels"],
        "0106" : ["US", "NumberOfHorizontalPixels"],
        "0108" : ["FD", "DisplayEnvironmentSpatialPosition"],
        "010A" : ["US", "ScreenMinimumGrayscaleBitDepth"],
        "010C" : ["US", "ScreenMinimumColorBitDepth"],
        "010E" : ["US", "ApplicationMaximumRepaintTime"],
        "0200" : ["SQ", "DisplaySetsSequence"],
        "0202" : ["US", "DisplaySetNumber"],
        "0203" : ["LO", "DisplaySetLabel"],
        "0204" : ["US", "DisplaySetPresentationGroup"],
        "0206" : ["LO", "DisplaySetPresentationGroupDescription"],
        "0208" : ["CS", "PartialDataDisplayHandling"],
        "0210" : ["SQ", "SynchronizedScrollingSequence"],
        "0212" : ["US", "DisplaySetScrollingGroup"],
        "0214" : ["SQ", "NavigationIndicatorSequence"],
        "0216" : ["US", "NavigationDisplaySet"],
        "0218" : ["US", "ReferenceDisplaySets"],
        "0300" : ["SQ", "ImageBoxesSequence"],
        "0302" : ["US", "ImageBoxNumber"],
        "0304" : ["CS", "ImageBoxLayoutType"],
        "0306" : ["US", "ImageBoxTileHorizontalDimension"],
        "0308" : ["US", "ImageBoxTileVerticalDimension"],
        "0310" : ["CS", "ImageBoxScrollDirection"],
        "0312" : ["CS", "ImageBoxSmallScrollType"],
        "0314" : ["US", "ImageBoxSmallScrollAmount"],
        "0316" : ["CS", "ImageBoxLargeScrollType"],
        "0318" : ["US", "ImageBoxLargeScrollAmount"],
        "0320" : ["US", "ImageBoxOverlapPriority"],
        "0330" : ["FD", "CineRelativeToRealTime"],
        "0400" : ["SQ", "FilterOperationsSequence"],
        "0402" : ["CS", "FilterByCategory"],
        "0404" : ["CS", "FilterByAttributePresence"],
        "0406" : ["CS", "FilterByOperator"],
        "0420" : ["US", "StructuredDisplayBackgroundCIELabValue"],
        "0421" : ["US", "EmptyImageBoxCIELabValue"],
        "0422" : ["SQ", "StructuredDisplayImageBoxSequence"],
        "0424" : ["SQ", "StructuredDisplayTextBoxSequence"],
        "0427" : ["SQ", "ReferencedFirstFrameSequence"],
        "0430" : ["SQ", "ImageBoxSynchronizationSequence"],
        "0432" : ["US", "SynchronizedImageBoxList"],
        "0434" : ["CS", "TypeOfSynchronization"],
        "0500" : ["CS", "BlendingOperationType"],
        "0510" : ["CS", "ReformattingOperationType"],
        "0512" : ["FD", "ReformattingThickness"],
        "0514" : ["FD", "ReformattingInterval"],
        "0516" : ["CS", "ReformattingOperationInitialViewDirection"],
        "0520" : ["CS", "ThreeDRenderingType"],
        "0600" : ["SQ", "SortingOperationsSequence"],
        "0602" : ["CS", "SortByCategory"],
        "0604" : ["CS", "SortingDirection"],
        "0700" : ["CS", "DisplaySetPatientOrientation"],
        "0702" : ["CS", "VOIType"],
        "0704" : ["CS", "PseudoColorType"],
        "0705" : ["SQ", "PseudoColorPaletteInstanceReferenceSequence"],
        "0706" : ["CS", "ShowGrayscaleInverted"],
        "0710" : ["CS", "ShowImageTrueSizeFlag"],
        "0712" : ["CS", "ShowGraphicAnnotationFlag"],
        "0714" : ["CS", "ShowPatientDemographicsFlag"],
        "0716" : ["CS", "ShowAcquisitionTechniquesFlag"],
        "0717" : ["CS", "DisplaySetHorizontalJustification"],
        "0718" : ["CS", "DisplaySetVerticalJustification"]
    },
    "0074" : {
        "0120" : ["FD", "ContinuationStartMeterset"],
        "0121" : ["FD", "ContinuationEndMeterset"],
        "1000" : ["CS", "ProcedureStepState"],
        "1002" : ["SQ", "ProcedureStepProgressInformationSequence"],
        "1004" : ["DS", "ProcedureStepProgress"],
        "1006" : ["ST", "ProcedureStepProgressDescription"],
        "1008" : ["SQ", "ProcedureStepCommunicationsURISequence"],
        "100A" : ["ST", "ContactURI"],
        "100C" : ["LO", "ContactDisplayName"],
        "100E" : ["SQ", "ProcedureStepDiscontinuationReasonCodeSequence"],
        "1020" : ["SQ", "BeamTaskSequence"],
        "1022" : ["CS", "BeamTaskType"],
        "1024" : ["IS", "BeamOrderIndexTrial"],
        "1026" : ["FD", "TableTopVerticalAdjustedPosition"],
        "1027" : ["FD", "TableTopLongitudinalAdjustedPosition"],
        "1028" : ["FD", "TableTopLateralAdjustedPosition"],
        "102A" : ["FD", "PatientSupportAdjustedAngle"],
        "102B" : ["FD", "TableTopEccentricAdjustedAngle"],
        "102C" : ["FD", "TableTopPitchAdjustedAngle"],
        "102D" : ["FD", "TableTopRollAdjustedAngle"],
        "1030" : ["SQ", "DeliveryVerificationImageSequence"],
        "1032" : ["CS", "VerificationImageTiming"],
        "1034" : ["CS", "DoubleExposureFlag"],
        "1036" : ["CS", "DoubleExposureOrdering"],
        "1038" : ["DS", "DoubleExposureMetersetTrial"],
        "103A" : ["DS", "DoubleExposureFieldDeltaTrial"],
        "1040" : ["SQ", "RelatedReferenceRTImageSequence"],
        "1042" : ["SQ", "GeneralMachineVerificationSequence"],
        "1044" : ["SQ", "ConventionalMachineVerificationSequence"],
        "1046" : ["SQ", "IonMachineVerificationSequence"],
        "1048" : ["SQ", "FailedAttributesSequence"],
        "104A" : ["SQ", "OverriddenAttributesSequence"],
        "104C" : ["SQ", "ConventionalControlPointVerificationSequence"],
        "104E" : ["SQ", "IonControlPointVerificationSequence"],
        "1050" : ["SQ", "AttributeOccurrenceSequence"],
        "1052" : ["AT", "AttributeOccurrencePointer"],
        "1054" : ["UL", "AttributeItemSelector"],
        "1056" : ["LO", "AttributeOccurrencePrivateCreator"],
        "1057" : ["IS", "SelectorSequencePointerItems"],
        "1200" : ["CS", "ScheduledProcedureStepPriority"],
        "1202" : ["LO", "WorklistLabel"],
        "1204" : ["LO", "ProcedureStepLabel"],
        "1210" : ["SQ", "ScheduledProcessingParametersSequence"],
        "1212" : ["SQ", "PerformedProcessingParametersSequence"],
        "1216" : ["SQ", "UnifiedProcedureStepPerformedProcedureSequence"],
        "1220" : ["SQ", "RelatedProcedureStepSequence"],
        "1222" : ["LO", "ProcedureStepRelationshipType"],
        "1224" : ["SQ", "ReplacedProcedureStepSequence"],
        "1230" : ["LO", "DeletionLock"],
        "1234" : ["AE", "ReceivingAE"],
        "1236" : ["AE", "RequestingAE"],
        "1238" : ["LT", "ReasonForCancellation"],
        "1242" : ["CS", "SCPStatus"],
        "1244" : ["CS", "SubscriptionListStatus"],
        "1246" : ["CS", "UnifiedProcedureStepListStatus"],
        "1324" : ["UL", "BeamOrderIndex"],
        "1338" : ["FD", "DoubleExposureMeterset"],
        "133A" : ["FD", "DoubleExposureFieldDelta"]
    },
    "0076" : {
        "0001" : ["LO", "ImplantAssemblyTemplateName"],
        "0003" : ["LO", "ImplantAssemblyTemplateIssuer"],
        "0006" : ["LO", "ImplantAssemblyTemplateVersion"],
        "0008" : ["SQ", "ReplacedImplantAssemblyTemplateSequence"],
        "000A" : ["CS", "ImplantAssemblyTemplateType"],
        "000C" : ["SQ", "OriginalImplantAssemblyTemplateSequence"],
        "000E" : ["SQ", "DerivationImplantAssemblyTemplateSequence"],
        "0010" : ["SQ", "ImplantAssemblyTemplateTargetAnatomySequence"],
        "0020" : ["SQ", "ProcedureTypeCodeSequence"],
        "0030" : ["LO", "SurgicalTechnique"],
        "0032" : ["SQ", "ComponentTypesSequence"],
        "0034" : ["CS", "ComponentTypeCodeSequence"],
        "0036" : ["CS", "ExclusiveComponentType"],
        "0038" : ["CS", "MandatoryComponentType"],
        "0040" : ["SQ", "ComponentSequence"],
        "0055" : ["US", "ComponentID"],
        "0060" : ["SQ", "ComponentAssemblySequence"],
        "0070" : ["US", "Component1ReferencedID"],
        "0080" : ["US", "Component1ReferencedMatingFeatureSetID"],
        "0090" : ["US", "Component1ReferencedMatingFeatureID"],
        "00A0" : ["US", "Component2ReferencedID"],
        "00B0" : ["US", "Component2ReferencedMatingFeatureSetID"],
        "00C0" : ["US", "Component2ReferencedMatingFeatureID"]
    },
    "0078" : {
        "0001" : ["LO", "ImplantTemplateGroupName"],
        "0010" : ["ST", "ImplantTemplateGroupDescription"],
        "0020" : ["LO", "ImplantTemplateGroupIssuer"],
        "0024" : ["LO", "ImplantTemplateGroupVersion"],
        "0026" : ["SQ", "ReplacedImplantTemplateGroupSequence"],
        "0028" : ["SQ", "ImplantTemplateGroupTargetAnatomySequence"],
        "002A" : ["SQ", "ImplantTemplateGroupMembersSequence"],
        "002E" : ["US", "ImplantTemplateGroupMemberID"],
        "0050" : ["FD", "ThreeDImplantTemplateGroupMemberMatchingPoint"],
        "0060" : ["FD", "ThreeDImplantTemplateGroupMemberMatchingAxes"],
        "0070" : ["SQ", "ImplantTemplateGroupMemberMatching2DCoordinatesSequence"],
        "0090" : ["FD", "TwoDImplantTemplateGroupMemberMatchingPoint"],
        "00A0" : ["FD", "TwoDImplantTemplateGroupMemberMatchingAxes"],
        "00B0" : ["SQ", "ImplantTemplateGroupVariationDimensionSequence"],
        "00B2" : ["LO", "ImplantTemplateGroupVariationDimensionName"],
        "00B4" : ["SQ", "ImplantTemplateGroupVariationDimensionRankSequence"],
        "00B6" : ["US", "ReferencedImplantTemplateGroupMemberID"],
        "00B8" : ["US", "ImplantTemplateGroupVariationDimensionRank"]
    },
    "0088" : {
        "0130" : ["SH", "StorageMediaFileSetID"],
        "0140" : ["UI", "StorageMediaFileSetUID"],
        "0200" : ["SQ", "IconImageSequence"],
        "0904" : ["LO", "TopicTitle"],
        "0906" : ["ST", "TopicSubject"],
        "0910" : ["LO", "TopicAuthor"],
        "0912" : ["LO", "TopicKeywords"]
    },
    "0100" : {
        "0410" : ["CS", "SOPInstanceStatus"],
        "0420" : ["DT", "SOPAuthorizationDateTime"],
        "0424" : ["LT", "SOPAuthorizationComment"],
        "0426" : ["LO", "AuthorizationEquipmentCertificationNumber"]
    },
    "0400" : {
        "0005" : ["US", "MACIDNumber"],
        "0010" : ["UI", "MACCalculationTransferSyntaxUID"],
        "0015" : ["CS", "MACAlgorithm"],
        "0020" : ["AT", "DataElementsSigned"],
        "0100" : ["UI", "DigitalSignatureUID"],
        "0105" : ["DT", "DigitalSignatureDateTime"],
        "0110" : ["CS", "CertificateType"],
        "0115" : ["OB", "CertificateOfSigner"],
        "0120" : ["OB", "Signature"],
        "0305" : ["CS", "CertifiedTimestampType"],
        "0310" : ["OB", "CertifiedTimestamp"],
        "0401" : ["SQ", "DigitalSignaturePurposeCodeSequence"],
        "0402" : ["SQ", "ReferencedDigitalSignatureSequence"],
        "0403" : ["SQ", "ReferencedSOPInstanceMACSequence"],
        "0404" : ["OB", "MAC"],
        "0500" : ["SQ", "EncryptedAttributesSequence"],
        "0510" : ["UI", "EncryptedContentTransferSyntaxUID"],
        "0520" : ["OB", "EncryptedContent"],
        "0550" : ["SQ", "ModifiedAttributesSequence"],
        "0561" : ["SQ", "OriginalAttributesSequence"],
        "0562" : ["DT", "AttributeModificationDateTime"],
        "0563" : ["LO", "ModifyingSystem"],
        "0564" : ["LO", "SourceOfPreviousValues"],
        "0565" : ["CS", "ReasonForTheAttributeModification"]
    },
    "2000" : {
        "0010" : ["IS", "NumberOfCopies"],
        "001E" : ["SQ", "PrinterConfigurationSequence"],
        "0020" : ["CS", "PrintPriority"],
        "0030" : ["CS", "MediumType"],
        "0040" : ["CS", "FilmDestination"],
        "0050" : ["LO", "FilmSessionLabel"],
        "0060" : ["IS", "MemoryAllocation"],
        "0061" : ["IS", "MaximumMemoryAllocation"],
        "0062" : ["CS", "ColorImagePrintingFlag"],
        "0063" : ["CS", "CollationFlag"],
        "0065" : ["CS", "AnnotationFlag"],
        "0067" : ["CS", "ImageOverlayFlag"],
        "0069" : ["CS", "PresentationLUTFlag"],
        "006A" : ["CS", "ImageBoxPresentationLUTFlag"],
        "00A0" : ["US", "MemoryBitDepth"],
        "00A1" : ["US", "PrintingBitDepth"],
        "00A2" : ["SQ", "MediaInstalledSequence"],
        "00A4" : ["SQ", "OtherMediaAvailableSequence"],
        "00A8" : ["SQ", "SupportedImageDisplayFormatsSequence"],
        "0500" : ["SQ", "ReferencedFilmBoxSequence"],
        "0510" : ["SQ", "ReferencedStoredPrintSequence"]
    },
    "2010" : {
        "0010" : ["ST", "ImageDisplayFormat"],
        "0030" : ["CS", "AnnotationDisplayFormatID"],
        "0040" : ["CS", "FilmOrientation"],
        "0050" : ["CS", "FilmSizeID"],
        "0052" : ["CS", "PrinterResolutionID"],
        "0054" : ["CS", "DefaultPrinterResolutionID"],
        "0060" : ["CS", "MagnificationType"],
        "0080" : ["CS", "SmoothingType"],
        "00A6" : ["CS", "DefaultMagnificationType"],
        "00A7" : ["CS", "OtherMagnificationTypesAvailable"],
        "00A8" : ["CS", "DefaultSmoothingType"],
        "00A9" : ["CS", "OtherSmoothingTypesAvailable"],
        "0100" : ["CS", "BorderDensity"],
        "0110" : ["CS", "EmptyImageDensity"],
        "0120" : ["US", "MinDensity"],
        "0130" : ["US", "MaxDensity"],
        "0140" : ["CS", "Trim"],
        "0150" : ["ST", "ConfigurationInformation"],
        "0152" : ["LT", "ConfigurationInformationDescription"],
        "0154" : ["IS", "MaximumCollatedFilms"],
        "015E" : ["US", "Illumination"],
        "0160" : ["US", "ReflectedAmbientLight"],
        "0376" : ["DS", "PrinterPixelSpacing"],
        "0500" : ["SQ", "ReferencedFilmSessionSequence"],
        "0510" : ["SQ", "ReferencedImageBoxSequence"],
        "0520" : ["SQ", "ReferencedBasicAnnotationBoxSequence"]
    },
    "2020" : {
        "0010" : ["US", "ImageBoxPosition"],
        "0020" : ["CS", "Polarity"],
        "0030" : ["DS", "RequestedImageSize"],
        "0040" : ["CS", "RequestedDecimateCropBehavior"],
        "0050" : ["CS", "RequestedResolutionID"],
        "00A0" : ["CS", "RequestedImageSizeFlag"],
        "00A2" : ["CS", "DecimateCropResult"],
        "0110" : ["SQ", "BasicGrayscaleImageSequence"],
        "0111" : ["SQ", "BasicColorImageSequence"],
        "0130" : ["SQ", "ReferencedImageOverlayBoxSequence"],
        "0140" : ["SQ", "ReferencedVOILUTBoxSequence"]
    },
    "2030" : {
        "0010" : ["US", "AnnotationPosition"],
        "0020" : ["LO", "TextString"]
    },
    "2040" : {
        "0010" : ["SQ", "ReferencedOverlayPlaneSequence"],
        "0011" : ["US", "ReferencedOverlayPlaneGroups"],
        "0020" : ["SQ", "OverlayPixelDataSequence"],
        "0060" : ["CS", "OverlayMagnificationType"],
        "0070" : ["CS", "OverlaySmoothingType"],
        "0072" : ["CS", "OverlayOrImageMagnification"],
        "0074" : ["US", "MagnifyToNumberOfColumns"],
        "0080" : ["CS", "OverlayForegroundDensity"],
        "0082" : ["CS", "OverlayBackgroundDensity"],
        "0090" : ["CS", "OverlayMode"],
        "0100" : ["CS", "ThresholdDensity"],
        "0500" : ["SQ", "ReferencedImageBoxSequenceRetired"]
    },
    "2050" : {
        "0010" : ["SQ", "PresentationLUTSequence"],
        "0020" : ["CS", "PresentationLUTShape"],
        "0500" : ["SQ", "ReferencedPresentationLUTSequence"]
    },
    "2100" : {
        "0010" : ["SH", "PrintJobID"],
        "0020" : ["CS", "ExecutionStatus"],
        "0030" : ["CS", "ExecutionStatusInfo"],
        "0040" : ["DA", "CreationDate"],
        "0050" : ["TM", "CreationTime"],
        "0070" : ["AE", "Originator"],
        "0140" : ["AE", "DestinationAE"],
        "0160" : ["SH", "OwnerID"],
        "0170" : ["IS", "NumberOfFilms"],
        "0500" : ["SQ", "ReferencedPrintJobSequencePullStoredPrint"]
    },
    "2110" : {
        "0010" : ["CS", "PrinterStatus"],
        "0020" : ["CS", "PrinterStatusInfo"],
        "0030" : ["LO", "PrinterName"],
        "0099" : ["SH", "PrintQueueID"]
    },
    "2120" : {
        "0010" : ["CS", "QueueStatus"],
        "0050" : ["SQ", "PrintJobDescriptionSequence"],
        "0070" : ["SQ", "ReferencedPrintJobSequence"]
    },
    "2130" : {
        "0010" : ["SQ", "PrintManagementCapabilitiesSequence"],
        "0015" : ["SQ", "PrinterCharacteristicsSequence"],
        "0030" : ["SQ", "FilmBoxContentSequence"],
        "0040" : ["SQ", "ImageBoxContentSequence"],
        "0050" : ["SQ", "AnnotationContentSequence"],
        "0060" : ["SQ", "ImageOverlayBoxContentSequence"],
        "0080" : ["SQ", "PresentationLUTContentSequence"],
        "00A0" : ["SQ", "ProposedStudySequence"],
        "00C0" : ["SQ", "OriginalImageSequence"]
    },
    "2200" : {
        "0001" : ["CS", "LabelUsingInformationExtractedFromInstances"],
        "0002" : ["UT", "LabelText"],
        "0003" : ["CS", "LabelStyleSelection"],
        "0004" : ["LT", "MediaDisposition"],
        "0005" : ["LT", "BarcodeValue"],
        "0006" : ["CS", "BarcodeSymbology"],
        "0007" : ["CS", "AllowMediaSplitting"],
        "0008" : ["CS", "IncludeNonDICOMObjects"],
        "0009" : ["CS", "IncludeDisplayApplication"],
        "000A" : ["CS", "PreserveCompositeInstancesAfterMediaCreation"],
        "000B" : ["US", "TotalNumberOfPiecesOfMediaCreated"],
        "000C" : ["LO", "RequestedMediaApplicationProfile"],
        "000D" : ["SQ", "ReferencedStorageMediaSequence"],
        "000E" : ["AT", "FailureAttributes"],
        "000F" : ["CS", "AllowLossyCompression"],
        "0020" : ["CS", "RequestPriority"]
    },
    "3002" : {
        "0002" : ["SH", "RTImageLabel"],
        "0003" : ["LO", "RTImageName"],
        "0004" : ["ST", "RTImageDescription"],
        "000A" : ["CS", "ReportedValuesOrigin"],
        "000C" : ["CS", "RTImagePlane"],
        "000D" : ["DS", "XRayImageReceptorTranslation"],
        "000E" : ["DS", "XRayImageReceptorAngle"],
        "0010" : ["DS", "RTImageOrientation"],
        "0011" : ["DS", "ImagePlanePixelSpacing"],
        "0012" : ["DS", "RTImagePosition"],
        "0020" : ["SH", "RadiationMachineName"],
        "0022" : ["DS", "RadiationMachineSAD"],
        "0024" : ["DS", "RadiationMachineSSD"],
        "0026" : ["DS", "RTImageSID"],
        "0028" : ["DS", "SourceToReferenceObjectDistance"],
        "0029" : ["IS", "FractionNumber"],
        "0030" : ["SQ", "ExposureSequence"],
        "0032" : ["DS", "MetersetExposure"],
        "0034" : ["DS", "DiaphragmPosition"],
        "0040" : ["SQ", "FluenceMapSequence"],
        "0041" : ["CS", "FluenceDataSource"],
        "0042" : ["DS", "FluenceDataScale"],
        "0050" : ["SQ", "PrimaryFluenceModeSequence"],
        "0051" : ["CS", "FluenceMode"],
        "0052" : ["SH", "FluenceModeID"]
    },
    "3004" : {
        "0001" : ["CS", "DVHType"],
        "0002" : ["CS", "DoseUnits"],
        "0004" : ["CS", "DoseType"],
        "0006" : ["LO", "DoseComment"],
        "0008" : ["DS", "NormalizationPoint"],
        "000A" : ["CS", "DoseSummationType"],
        "000C" : ["DS", "GridFrameOffsetVector"],
        "000E" : ["DS", "DoseGridScaling"],
        "0010" : ["SQ", "RTDoseROISequence"],
        "0012" : ["DS", "DoseValue"],
        "0014" : ["CS", "TissueHeterogeneityCorrection"],
        "0040" : ["DS", "DVHNormalizationPoint"],
        "0042" : ["DS", "DVHNormalizationDoseValue"],
        "0050" : ["SQ", "DVHSequence"],
        "0052" : ["DS", "DVHDoseScaling"],
        "0054" : ["CS", "DVHVolumeUnits"],
        "0056" : ["IS", "DVHNumberOfBins"],
        "0058" : ["DS", "DVHData"],
        "0060" : ["SQ", "DVHReferencedROISequence"],
        "0062" : ["CS", "DVHROIContributionType"],
        "0070" : ["DS", "DVHMinimumDose"],
        "0072" : ["DS", "DVHMaximumDose"],
        "0074" : ["DS", "DVHMeanDose"]
    },
    "3006" : {
        "0002" : ["SH", "StructureSetLabel"],
        "0004" : ["LO", "StructureSetName"],
        "0006" : ["ST", "StructureSetDescription"],
        "0008" : ["DA", "StructureSetDate"],
        "0009" : ["TM", "StructureSetTime"],
        "0010" : ["SQ", "ReferencedFrameOfReferenceSequence"],
        "0012" : ["SQ", "RTReferencedStudySequence"],
        "0014" : ["SQ", "RTReferencedSeriesSequence"],
        "0016" : ["SQ", "ContourImageSequence"],
        "0020" : ["SQ", "StructureSetROISequence"],
        "0022" : ["IS", "ROINumber"],
        "0024" : ["UI", "ReferencedFrameOfReferenceUID"],
        "0026" : ["LO", "ROIName"],
        "0028" : ["ST", "ROIDescription"],
        "002A" : ["IS", "ROIDisplayColor"],
        "002C" : ["DS", "ROIVolume"],
        "0030" : ["SQ", "RTRelatedROISequence"],
        "0033" : ["CS", "RTROIRelationship"],
        "0036" : ["CS", "ROIGenerationAlgorithm"],
        "0038" : ["LO", "ROIGenerationDescription"],
        "0039" : ["SQ", "ROIContourSequence"],
        "0040" : ["SQ", "ContourSequence"],
        "0042" : ["CS", "ContourGeometricType"],
        "0044" : ["DS", "ContourSlabThickness"],
        "0045" : ["DS", "ContourOffsetVector"],
        "0046" : ["IS", "NumberOfContourPoints"],
        "0048" : ["IS", "ContourNumber"],
        "0049" : ["IS", "AttachedContours"],
        "0050" : ["DS", "ContourData"],
        "0080" : ["SQ", "RTROIObservationsSequence"],
        "0082" : ["IS", "ObservationNumber"],
        "0084" : ["IS", "ReferencedROINumber"],
        "0085" : ["SH", "ROIObservationLabel"],
        "0086" : ["SQ", "RTROIIdentificationCodeSequence"],
        "0088" : ["ST", "ROIObservationDescription"],
        "00A0" : ["SQ", "RelatedRTROIObservationsSequence"],
        "00A4" : ["CS", "RTROIInterpretedType"],
        "00A6" : ["PN", "ROIInterpreter"],
        "00B0" : ["SQ", "ROIPhysicalPropertiesSequence"],
        "00B2" : ["CS", "ROIPhysicalProperty"],
        "00B4" : ["DS", "ROIPhysicalPropertyValue"],
        "00B6" : ["SQ", "ROIElementalCompositionSequence"],
        "00B7" : ["US", "ROIElementalCompositionAtomicNumber"],
        "00B8" : ["FL", "ROIElementalCompositionAtomicMassFraction"],
        "00C0" : ["SQ", "FrameOfReferenceRelationshipSequence"],
        "00C2" : ["UI", "RelatedFrameOfReferenceUID"],
        "00C4" : ["CS", "FrameOfReferenceTransformationType"],
        "00C6" : ["DS", "FrameOfReferenceTransformationMatrix"],
        "00C8" : ["LO", "FrameOfReferenceTransformationComment"]
    },
    "3008" : {
        "0010" : ["SQ", "MeasuredDoseReferenceSequence"],
        "0012" : ["ST", "MeasuredDoseDescription"],
        "0014" : ["CS", "MeasuredDoseType"],
        "0016" : ["DS", "MeasuredDoseValue"],
        "0020" : ["SQ", "TreatmentSessionBeamSequence"],
        "0021" : ["SQ", "TreatmentSessionIonBeamSequence"],
        "0022" : ["IS", "CurrentFractionNumber"],
        "0024" : ["DA", "TreatmentControlPointDate"],
        "0025" : ["TM", "TreatmentControlPointTime"],
        "002A" : ["CS", "TreatmentTerminationStatus"],
        "002B" : ["SH", "TreatmentTerminationCode"],
        "002C" : ["CS", "TreatmentVerificationStatus"],
        "0030" : ["SQ", "ReferencedTreatmentRecordSequence"],
        "0032" : ["DS", "SpecifiedPrimaryMeterset"],
        "0033" : ["DS", "SpecifiedSecondaryMeterset"],
        "0036" : ["DS", "DeliveredPrimaryMeterset"],
        "0037" : ["DS", "DeliveredSecondaryMeterset"],
        "003A" : ["DS", "SpecifiedTreatmentTime"],
        "003B" : ["DS", "DeliveredTreatmentTime"],
        "0040" : ["SQ", "ControlPointDeliverySequence"],
        "0041" : ["SQ", "IonControlPointDeliverySequence"],
        "0042" : ["DS", "SpecifiedMeterset"],
        "0044" : ["DS", "DeliveredMeterset"],
        "0045" : ["FL", "MetersetRateSet"],
        "0046" : ["FL", "MetersetRateDelivered"],
        "0047" : ["FL", "ScanSpotMetersetsDelivered"],
        "0048" : ["DS", "DoseRateDelivered"],
        "0050" : ["SQ", "TreatmentSummaryCalculatedDoseReferenceSequence"],
        "0052" : ["DS", "CumulativeDoseToDoseReference"],
        "0054" : ["DA", "FirstTreatmentDate"],
        "0056" : ["DA", "MostRecentTreatmentDate"],
        "005A" : ["IS", "NumberOfFractionsDelivered"],
        "0060" : ["SQ", "OverrideSequence"],
        "0061" : ["AT", "ParameterSequencePointer"],
        "0062" : ["AT", "OverrideParameterPointer"],
        "0063" : ["IS", "ParameterItemIndex"],
        "0064" : ["IS", "MeasuredDoseReferenceNumber"],
        "0065" : ["AT", "ParameterPointer"],
        "0066" : ["ST", "OverrideReason"],
        "0068" : ["SQ", "CorrectedParameterSequence"],
        "006A" : ["FL", "CorrectionValue"],
        "0070" : ["SQ", "CalculatedDoseReferenceSequence"],
        "0072" : ["IS", "CalculatedDoseReferenceNumber"],
        "0074" : ["ST", "CalculatedDoseReferenceDescription"],
        "0076" : ["DS", "CalculatedDoseReferenceDoseValue"],
        "0078" : ["DS", "StartMeterset"],
        "007A" : ["DS", "EndMeterset"],
        "0080" : ["SQ", "ReferencedMeasuredDoseReferenceSequence"],
        "0082" : ["IS", "ReferencedMeasuredDoseReferenceNumber"],
        "0090" : ["SQ", "ReferencedCalculatedDoseReferenceSequence"],
        "0092" : ["IS", "ReferencedCalculatedDoseReferenceNumber"],
        "00A0" : ["SQ", "BeamLimitingDeviceLeafPairsSequence"],
        "00B0" : ["SQ", "RecordedWedgeSequence"],
        "00C0" : ["SQ", "RecordedCompensatorSequence"],
        "00D0" : ["SQ", "RecordedBlockSequence"],
        "00E0" : ["SQ", "TreatmentSummaryMeasuredDoseReferenceSequence"],
        "00F0" : ["SQ", "RecordedSnoutSequence"],
        "00F2" : ["SQ", "RecordedRangeShifterSequence"],
        "00F4" : ["SQ", "RecordedLateralSpreadingDeviceSequence"],
        "00F6" : ["SQ", "RecordedRangeModulatorSequence"],
        "0100" : ["SQ", "RecordedSourceSequence"],
        "0105" : ["LO", "SourceSerialNumber"],
        "0110" : ["SQ", "TreatmentSessionApplicationSetupSequence"],
        "0116" : ["CS", "ApplicationSetupCheck"],
        "0120" : ["SQ", "RecordedBrachyAccessoryDeviceSequence"],
        "0122" : ["IS", "ReferencedBrachyAccessoryDeviceNumber"],
        "0130" : ["SQ", "RecordedChannelSequence"],
        "0132" : ["DS", "SpecifiedChannelTotalTime"],
        "0134" : ["DS", "DeliveredChannelTotalTime"],
        "0136" : ["IS", "SpecifiedNumberOfPulses"],
        "0138" : ["IS", "DeliveredNumberOfPulses"],
        "013A" : ["DS", "SpecifiedPulseRepetitionInterval"],
        "013C" : ["DS", "DeliveredPulseRepetitionInterval"],
        "0140" : ["SQ", "RecordedSourceApplicatorSequence"],
        "0142" : ["IS", "ReferencedSourceApplicatorNumber"],
        "0150" : ["SQ", "RecordedChannelShieldSequence"],
        "0152" : ["IS", "ReferencedChannelShieldNumber"],
        "0160" : ["SQ", "BrachyControlPointDeliveredSequence"],
        "0162" : ["DA", "SafePositionExitDate"],
        "0164" : ["TM", "SafePositionExitTime"],
        "0166" : ["DA", "SafePositionReturnDate"],
        "0168" : ["TM", "SafePositionReturnTime"],
        "0200" : ["CS", "CurrentTreatmentStatus"],
        "0202" : ["ST", "TreatmentStatusComment"],
        "0220" : ["SQ", "FractionGroupSummarySequence"],
        "0223" : ["IS", "ReferencedFractionNumber"],
        "0224" : ["CS", "FractionGroupType"],
        "0230" : ["CS", "BeamStopperPosition"],
        "0240" : ["SQ", "FractionStatusSummarySequence"],
        "0250" : ["DA", "TreatmentDate"],
        "0251" : ["TM", "TreatmentTime"]
    },
    "300A" : {
        "0002" : ["SH", "RTPlanLabel"],
        "0003" : ["LO", "RTPlanName"],
        "0004" : ["ST", "RTPlanDescription"],
        "0006" : ["DA", "RTPlanDate"],
        "0007" : ["TM", "RTPlanTime"],
        "0009" : ["LO", "TreatmentProtocols"],
        "000A" : ["CS", "PlanIntent"],
        "000B" : ["LO", "TreatmentSites"],
        "000C" : ["CS", "RTPlanGeometry"],
        "000E" : ["ST", "PrescriptionDescription"],
        "0010" : ["SQ", "DoseReferenceSequence"],
        "0012" : ["IS", "DoseReferenceNumber"],
        "0013" : ["UI", "DoseReferenceUID"],
        "0014" : ["CS", "DoseReferenceStructureType"],
        "0015" : ["CS", "NominalBeamEnergyUnit"],
        "0016" : ["LO", "DoseReferenceDescription"],
        "0018" : ["DS", "DoseReferencePointCoordinates"],
        "001A" : ["DS", "NominalPriorDose"],
        "0020" : ["CS", "DoseReferenceType"],
        "0021" : ["DS", "ConstraintWeight"],
        "0022" : ["DS", "DeliveryWarningDose"],
        "0023" : ["DS", "DeliveryMaximumDose"],
        "0025" : ["DS", "TargetMinimumDose"],
        "0026" : ["DS", "TargetPrescriptionDose"],
        "0027" : ["DS", "TargetMaximumDose"],
        "0028" : ["DS", "TargetUnderdoseVolumeFraction"],
        "002A" : ["DS", "OrganAtRiskFullVolumeDose"],
        "002B" : ["DS", "OrganAtRiskLimitDose"],
        "002C" : ["DS", "OrganAtRiskMaximumDose"],
        "002D" : ["DS", "OrganAtRiskOverdoseVolumeFraction"],
        "0040" : ["SQ", "ToleranceTableSequence"],
        "0042" : ["IS", "ToleranceTableNumber"],
        "0043" : ["SH", "ToleranceTableLabel"],
        "0044" : ["DS", "GantryAngleTolerance"],
        "0046" : ["DS", "BeamLimitingDeviceAngleTolerance"],
        "0048" : ["SQ", "BeamLimitingDeviceToleranceSequence"],
        "004A" : ["DS", "BeamLimitingDevicePositionTolerance"],
        "004B" : ["FL", "SnoutPositionTolerance"],
        "004C" : ["DS", "PatientSupportAngleTolerance"],
        "004E" : ["DS", "TableTopEccentricAngleTolerance"],
        "004F" : ["FL", "TableTopPitchAngleTolerance"],
        "0050" : ["FL", "TableTopRollAngleTolerance"],
        "0051" : ["DS", "TableTopVerticalPositionTolerance"],
        "0052" : ["DS", "TableTopLongitudinalPositionTolerance"],
        "0053" : ["DS", "TableTopLateralPositionTolerance"],
        "0055" : ["CS", "RTPlanRelationship"],
        "0070" : ["SQ", "FractionGroupSequence"],
        "0071" : ["IS", "FractionGroupNumber"],
        "0072" : ["LO", "FractionGroupDescription"],
        "0078" : ["IS", "NumberOfFractionsPlanned"],
        "0079" : ["IS", "NumberOfFractionPatternDigitsPerDay"],
        "007A" : ["IS", "RepeatFractionCycleLength"],
        "007B" : ["LT", "FractionPattern"],
        "0080" : ["IS", "NumberOfBeams"],
        "0082" : ["DS", "BeamDoseSpecificationPoint"],
        "0084" : ["DS", "BeamDose"],
        "0086" : ["DS", "BeamMeterset"],
        "0088" : ["FL", "BeamDosePointDepth"],
        "0089" : ["FL", "BeamDosePointEquivalentDepth"],
        "008A" : ["FL", "BeamDosePointSSD"],
        "00A0" : ["IS", "NumberOfBrachyApplicationSetups"],
        "00A2" : ["DS", "BrachyApplicationSetupDoseSpecificationPoint"],
        "00A4" : ["DS", "BrachyApplicationSetupDose"],
        "00B0" : ["SQ", "BeamSequence"],
        "00B2" : ["SH", "TreatmentMachineName"],
        "00B3" : ["CS", "PrimaryDosimeterUnit"],
        "00B4" : ["DS", "SourceAxisDistance"],
        "00B6" : ["SQ", "BeamLimitingDeviceSequence"],
        "00B8" : ["CS", "RTBeamLimitingDeviceType"],
        "00BA" : ["DS", "SourceToBeamLimitingDeviceDistance"],
        "00BB" : ["FL", "IsocenterToBeamLimitingDeviceDistance"],
        "00BC" : ["IS", "NumberOfLeafJawPairs"],
        "00BE" : ["DS", "LeafPositionBoundaries"],
        "00C0" : ["IS", "BeamNumber"],
        "00C2" : ["LO", "BeamName"],
        "00C3" : ["ST", "BeamDescription"],
        "00C4" : ["CS", "BeamType"],
        "00C6" : ["CS", "RadiationType"],
        "00C7" : ["CS", "HighDoseTechniqueType"],
        "00C8" : ["IS", "ReferenceImageNumber"],
        "00CA" : ["SQ", "PlannedVerificationImageSequence"],
        "00CC" : ["LO", "ImagingDeviceSpecificAcquisitionParameters"],
        "00CE" : ["CS", "TreatmentDeliveryType"],
        "00D0" : ["IS", "NumberOfWedges"],
        "00D1" : ["SQ", "WedgeSequence"],
        "00D2" : ["IS", "WedgeNumber"],
        "00D3" : ["CS", "WedgeType"],
        "00D4" : ["SH", "WedgeID"],
        "00D5" : ["IS", "WedgeAngle"],
        "00D6" : ["DS", "WedgeFactor"],
        "00D7" : ["FL", "TotalWedgeTrayWaterEquivalentThickness"],
        "00D8" : ["DS", "WedgeOrientation"],
        "00D9" : ["FL", "IsocenterToWedgeTrayDistance"],
        "00DA" : ["DS", "SourceToWedgeTrayDistance"],
        "00DB" : ["FL", "WedgeThinEdgePosition"],
        "00DC" : ["SH", "BolusID"],
        "00DD" : ["ST", "BolusDescription"],
        "00E0" : ["IS", "NumberOfCompensators"],
        "00E1" : ["SH", "MaterialID"],
        "00E2" : ["DS", "TotalCompensatorTrayFactor"],
        "00E3" : ["SQ", "CompensatorSequence"],
        "00E4" : ["IS", "CompensatorNumber"],
        "00E5" : ["SH", "CompensatorID"],
        "00E6" : ["DS", "SourceToCompensatorTrayDistance"],
        "00E7" : ["IS", "CompensatorRows"],
        "00E8" : ["IS", "CompensatorColumns"],
        "00E9" : ["DS", "CompensatorPixelSpacing"],
        "00EA" : ["DS", "CompensatorPosition"],
        "00EB" : ["DS", "CompensatorTransmissionData"],
        "00EC" : ["DS", "CompensatorThicknessData"],
        "00ED" : ["IS", "NumberOfBoli"],
        "00EE" : ["CS", "CompensatorType"],
        "00F0" : ["IS", "NumberOfBlocks"],
        "00F2" : ["DS", "TotalBlockTrayFactor"],
        "00F3" : ["FL", "TotalBlockTrayWaterEquivalentThickness"],
        "00F4" : ["SQ", "BlockSequence"],
        "00F5" : ["SH", "BlockTrayID"],
        "00F6" : ["DS", "SourceToBlockTrayDistance"],
        "00F7" : ["FL", "IsocenterToBlockTrayDistance"],
        "00F8" : ["CS", "BlockType"],
        "00F9" : ["LO", "AccessoryCode"],
        "00FA" : ["CS", "BlockDivergence"],
        "00FB" : ["CS", "BlockMountingPosition"],
        "00FC" : ["IS", "BlockNumber"],
        "00FE" : ["LO", "BlockName"],
        "0100" : ["DS", "BlockThickness"],
        "0102" : ["DS", "BlockTransmission"],
        "0104" : ["IS", "BlockNumberOfPoints"],
        "0106" : ["DS", "BlockData"],
        "0107" : ["SQ", "ApplicatorSequence"],
        "0108" : ["SH", "ApplicatorID"],
        "0109" : ["CS", "ApplicatorType"],
        "010A" : ["LO", "ApplicatorDescription"],
        "010C" : ["DS", "CumulativeDoseReferenceCoefficient"],
        "010E" : ["DS", "FinalCumulativeMetersetWeight"],
        "0110" : ["IS", "NumberOfControlPoints"],
        "0111" : ["SQ", "ControlPointSequence"],
        "0112" : ["IS", "ControlPointIndex"],
        "0114" : ["DS", "NominalBeamEnergy"],
        "0115" : ["DS", "DoseRateSet"],
        "0116" : ["SQ", "WedgePositionSequence"],
        "0118" : ["CS", "WedgePosition"],
        "011A" : ["SQ", "BeamLimitingDevicePositionSequence"],
        "011C" : ["DS", "LeafJawPositions"],
        "011E" : ["DS", "GantryAngle"],
        "011F" : ["CS", "GantryRotationDirection"],
        "0120" : ["DS", "BeamLimitingDeviceAngle"],
        "0121" : ["CS", "BeamLimitingDeviceRotationDirection"],
        "0122" : ["DS", "PatientSupportAngle"],
        "0123" : ["CS", "PatientSupportRotationDirection"],
        "0124" : ["DS", "TableTopEccentricAxisDistance"],
        "0125" : ["DS", "TableTopEccentricAngle"],
        "0126" : ["CS", "TableTopEccentricRotationDirection"],
        "0128" : ["DS", "TableTopVerticalPosition"],
        "0129" : ["DS", "TableTopLongitudinalPosition"],
        "012A" : ["DS", "TableTopLateralPosition"],
        "012C" : ["DS", "IsocenterPosition"],
        "012E" : ["DS", "SurfaceEntryPoint"],
        "0130" : ["DS", "SourceToSurfaceDistance"],
        "0134" : ["DS", "CumulativeMetersetWeight"],
        "0140" : ["FL", "TableTopPitchAngle"],
        "0142" : ["CS", "TableTopPitchRotationDirection"],
        "0144" : ["FL", "TableTopRollAngle"],
        "0146" : ["CS", "TableTopRollRotationDirection"],
        "0148" : ["FL", "HeadFixationAngle"],
        "014A" : ["FL", "GantryPitchAngle"],
        "014C" : ["CS", "GantryPitchRotationDirection"],
        "014E" : ["FL", "GantryPitchAngleTolerance"],
        "0180" : ["SQ", "PatientSetupSequence"],
        "0182" : ["IS", "PatientSetupNumber"],
        "0183" : ["LO", "PatientSetupLabel"],
        "0184" : ["LO", "PatientAdditionalPosition"],
        "0190" : ["SQ", "FixationDeviceSequence"],
        "0192" : ["CS", "FixationDeviceType"],
        "0194" : ["SH", "FixationDeviceLabel"],
        "0196" : ["ST", "FixationDeviceDescription"],
        "0198" : ["SH", "FixationDevicePosition"],
        "0199" : ["FL", "FixationDevicePitchAngle"],
        "019A" : ["FL", "FixationDeviceRollAngle"],
        "01A0" : ["SQ", "ShieldingDeviceSequence"],
        "01A2" : ["CS", "ShieldingDeviceType"],
        "01A4" : ["SH", "ShieldingDeviceLabel"],
        "01A6" : ["ST", "ShieldingDeviceDescription"],
        "01A8" : ["SH", "ShieldingDevicePosition"],
        "01B0" : ["CS", "SetupTechnique"],
        "01B2" : ["ST", "SetupTechniqueDescription"],
        "01B4" : ["SQ", "SetupDeviceSequence"],
        "01B6" : ["CS", "SetupDeviceType"],
        "01B8" : ["SH", "SetupDeviceLabel"],
        "01BA" : ["ST", "SetupDeviceDescription"],
        "01BC" : ["DS", "SetupDeviceParameter"],
        "01D0" : ["ST", "SetupReferenceDescription"],
        "01D2" : ["DS", "TableTopVerticalSetupDisplacement"],
        "01D4" : ["DS", "TableTopLongitudinalSetupDisplacement"],
        "01D6" : ["DS", "TableTopLateralSetupDisplacement"],
        "0200" : ["CS", "BrachyTreatmentTechnique"],
        "0202" : ["CS", "BrachyTreatmentType"],
        "0206" : ["SQ", "TreatmentMachineSequence"],
        "0210" : ["SQ", "SourceSequence"],
        "0212" : ["IS", "SourceNumber"],
        "0214" : ["CS", "SourceType"],
        "0216" : ["LO", "SourceManufacturer"],
        "0218" : ["DS", "ActiveSourceDiameter"],
        "021A" : ["DS", "ActiveSourceLength"],
        "0222" : ["DS", "SourceEncapsulationNominalThickness"],
        "0224" : ["DS", "SourceEncapsulationNominalTransmission"],
        "0226" : ["LO", "SourceIsotopeName"],
        "0228" : ["DS", "SourceIsotopeHalfLife"],
        "0229" : ["CS", "SourceStrengthUnits"],
        "022A" : ["DS", "ReferenceAirKermaRate"],
        "022B" : ["DS", "SourceStrength"],
        "022C" : ["DA", "SourceStrengthReferenceDate"],
        "022E" : ["TM", "SourceStrengthReferenceTime"],
        "0230" : ["SQ", "ApplicationSetupSequence"],
        "0232" : ["CS", "ApplicationSetupType"],
        "0234" : ["IS", "ApplicationSetupNumber"],
        "0236" : ["LO", "ApplicationSetupName"],
        "0238" : ["LO", "ApplicationSetupManufacturer"],
        "0240" : ["IS", "TemplateNumber"],
        "0242" : ["SH", "TemplateType"],
        "0244" : ["LO", "TemplateName"],
        "0250" : ["DS", "TotalReferenceAirKerma"],
        "0260" : ["SQ", "BrachyAccessoryDeviceSequence"],
        "0262" : ["IS", "BrachyAccessoryDeviceNumber"],
        "0263" : ["SH", "BrachyAccessoryDeviceID"],
        "0264" : ["CS", "BrachyAccessoryDeviceType"],
        "0266" : ["LO", "BrachyAccessoryDeviceName"],
        "026A" : ["DS", "BrachyAccessoryDeviceNominalThickness"],
        "026C" : ["DS", "BrachyAccessoryDeviceNominalTransmission"],
        "0280" : ["SQ", "ChannelSequence"],
        "0282" : ["IS", "ChannelNumber"],
        "0284" : ["DS", "ChannelLength"],
        "0286" : ["DS", "ChannelTotalTime"],
        "0288" : ["CS", "SourceMovementType"],
        "028A" : ["IS", "NumberOfPulses"],
        "028C" : ["DS", "PulseRepetitionInterval"],
        "0290" : ["IS", "SourceApplicatorNumber"],
        "0291" : ["SH", "SourceApplicatorID"],
        "0292" : ["CS", "SourceApplicatorType"],
        "0294" : ["LO", "SourceApplicatorName"],
        "0296" : ["DS", "SourceApplicatorLength"],
        "0298" : ["LO", "SourceApplicatorManufacturer"],
        "029C" : ["DS", "SourceApplicatorWallNominalThickness"],
        "029E" : ["DS", "SourceApplicatorWallNominalTransmission"],
        "02A0" : ["DS", "SourceApplicatorStepSize"],
        "02A2" : ["IS", "TransferTubeNumber"],
        "02A4" : ["DS", "TransferTubeLength"],
        "02B0" : ["SQ", "ChannelShieldSequence"],
        "02B2" : ["IS", "ChannelShieldNumber"],
        "02B3" : ["SH", "ChannelShieldID"],
        "02B4" : ["LO", "ChannelShieldName"],
        "02B8" : ["DS", "ChannelShieldNominalThickness"],
        "02BA" : ["DS", "ChannelShieldNominalTransmission"],
        "02C8" : ["DS", "FinalCumulativeTimeWeight"],
        "02D0" : ["SQ", "BrachyControlPointSequence"],
        "02D2" : ["DS", "ControlPointRelativePosition"],
        "02D4" : ["DS", "ControlPoint3DPosition"],
        "02D6" : ["DS", "CumulativeTimeWeight"],
        "02E0" : ["CS", "CompensatorDivergence"],
        "02E1" : ["CS", "CompensatorMountingPosition"],
        "02E2" : ["DS", "SourceToCompensatorDistance"],
        "02E3" : ["FL", "TotalCompensatorTrayWaterEquivalentThickness"],
        "02E4" : ["FL", "IsocenterToCompensatorTrayDistance"],
        "02E5" : ["FL", "CompensatorColumnOffset"],
        "02E6" : ["FL", "IsocenterToCompensatorDistances"],
        "02E7" : ["FL", "CompensatorRelativeStoppingPowerRatio"],
        "02E8" : ["FL", "CompensatorMillingToolDiameter"],
        "02EA" : ["SQ", "IonRangeCompensatorSequence"],
        "02EB" : ["LT", "CompensatorDescription"],
        "0302" : ["IS", "RadiationMassNumber"],
        "0304" : ["IS", "RadiationAtomicNumber"],
        "0306" : ["SS", "RadiationChargeState"],
        "0308" : ["CS", "ScanMode"],
        "030A" : ["FL", "VirtualSourceAxisDistances"],
        "030C" : ["SQ", "SnoutSequence"],
        "030D" : ["FL", "SnoutPosition"],
        "030F" : ["SH", "SnoutID"],
        "0312" : ["IS", "NumberOfRangeShifters"],
        "0314" : ["SQ", "RangeShifterSequence"],
        "0316" : ["IS", "RangeShifterNumber"],
        "0318" : ["SH", "RangeShifterID"],
        "0320" : ["CS", "RangeShifterType"],
        "0322" : ["LO", "RangeShifterDescription"],
        "0330" : ["IS", "NumberOfLateralSpreadingDevices"],
        "0332" : ["SQ", "LateralSpreadingDeviceSequence"],
        "0334" : ["IS", "LateralSpreadingDeviceNumber"],
        "0336" : ["SH", "LateralSpreadingDeviceID"],
        "0338" : ["CS", "LateralSpreadingDeviceType"],
        "033A" : ["LO", "LateralSpreadingDeviceDescription"],
        "033C" : ["FL", "LateralSpreadingDeviceWaterEquivalentThickness"],
        "0340" : ["IS", "NumberOfRangeModulators"],
        "0342" : ["SQ", "RangeModulatorSequence"],
        "0344" : ["IS", "RangeModulatorNumber"],
        "0346" : ["SH", "RangeModulatorID"],
        "0348" : ["CS", "RangeModulatorType"],
        "034A" : ["LO", "RangeModulatorDescription"],
        "034C" : ["SH", "BeamCurrentModulationID"],
        "0350" : ["CS", "PatientSupportType"],
        "0352" : ["SH", "PatientSupportID"],
        "0354" : ["LO", "PatientSupportAccessoryCode"],
        "0356" : ["FL", "FixationLightAzimuthalAngle"],
        "0358" : ["FL", "FixationLightPolarAngle"],
        "035A" : ["FL", "MetersetRate"],
        "0360" : ["SQ", "RangeShifterSettingsSequence"],
        "0362" : ["LO", "RangeShifterSetting"],
        "0364" : ["FL", "IsocenterToRangeShifterDistance"],
        "0366" : ["FL", "RangeShifterWaterEquivalentThickness"],
        "0370" : ["SQ", "LateralSpreadingDeviceSettingsSequence"],
        "0372" : ["LO", "LateralSpreadingDeviceSetting"],
        "0374" : ["FL", "IsocenterToLateralSpreadingDeviceDistance"],
        "0380" : ["SQ", "RangeModulatorSettingsSequence"],
        "0382" : ["FL", "RangeModulatorGatingStartValue"],
        "0384" : ["FL", "RangeModulatorGatingStopValue"],
        "0386" : ["FL", "RangeModulatorGatingStartWaterEquivalentThickness"],
        "0388" : ["FL", "RangeModulatorGatingStopWaterEquivalentThickness"],
        "038A" : ["FL", "IsocenterToRangeModulatorDistance"],
        "0390" : ["SH", "ScanSpotTuneID"],
        "0392" : ["IS", "NumberOfScanSpotPositions"],
        "0394" : ["FL", "ScanSpotPositionMap"],
        "0396" : ["FL", "ScanSpotMetersetWeights"],
        "0398" : ["FL", "ScanningSpotSize"],
        "039A" : ["IS", "NumberOfPaintings"],
        "03A0" : ["SQ", "IonToleranceTableSequence"],
        "03A2" : ["SQ", "IonBeamSequence"],
        "03A4" : ["SQ", "IonBeamLimitingDeviceSequence"],
        "03A6" : ["SQ", "IonBlockSequence"],
        "03A8" : ["SQ", "IonControlPointSequence"],
        "03AA" : ["SQ", "IonWedgeSequence"],
        "03AC" : ["SQ", "IonWedgePositionSequence"],
        "0401" : ["SQ", "ReferencedSetupImageSequence"],
        "0402" : ["ST", "SetupImageComment"],
        "0410" : ["SQ", "MotionSynchronizationSequence"],
        "0412" : ["FL", "ControlPointOrientation"],
        "0420" : ["SQ", "GeneralAccessorySequence"],
        "0421" : ["SH", "GeneralAccessoryID"],
        "0422" : ["ST", "GeneralAccessoryDescription"],
        "0423" : ["CS", "GeneralAccessoryType"],
        "0424" : ["IS", "GeneralAccessoryNumber"],
        "0431" : ["SQ", "ApplicatorGeometrySequence"],
        "0432" : ["CS", "ApplicatorApertureShape"],
        "0433" : ["FL", "ApplicatorOpening"],
        "0434" : ["FL", "ApplicatorOpeningX"],
        "0435" : ["FL", "ApplicatorOpeningY"],
        "0436" : ["FL", "SourceToApplicatorMountingPositionDistance"]
    },
    "300C" : {
        "0002" : ["SQ", "ReferencedRTPlanSequence"],
        "0004" : ["SQ", "ReferencedBeamSequence"],
        "0006" : ["IS", "ReferencedBeamNumber"],
        "0007" : ["IS", "ReferencedReferenceImageNumber"],
        "0008" : ["DS", "StartCumulativeMetersetWeight"],
        "0009" : ["DS", "EndCumulativeMetersetWeight"],
        "000A" : ["SQ", "ReferencedBrachyApplicationSetupSequence"],
        "000C" : ["IS", "ReferencedBrachyApplicationSetupNumber"],
        "000E" : ["IS", "ReferencedSourceNumber"],
        "0020" : ["SQ", "ReferencedFractionGroupSequence"],
        "0022" : ["IS", "ReferencedFractionGroupNumber"],
        "0040" : ["SQ", "ReferencedVerificationImageSequence"],
        "0042" : ["SQ", "ReferencedReferenceImageSequence"],
        "0050" : ["SQ", "ReferencedDoseReferenceSequence"],
        "0051" : ["IS", "ReferencedDoseReferenceNumber"],
        "0055" : ["SQ", "BrachyReferencedDoseReferenceSequence"],
        "0060" : ["SQ", "ReferencedStructureSetSequence"],
        "006A" : ["IS", "ReferencedPatientSetupNumber"],
        "0080" : ["SQ", "ReferencedDoseSequence"],
        "00A0" : ["IS", "ReferencedToleranceTableNumber"],
        "00B0" : ["SQ", "ReferencedBolusSequence"],
        "00C0" : ["IS", "ReferencedWedgeNumber"],
        "00D0" : ["IS", "ReferencedCompensatorNumber"],
        "00E0" : ["IS", "ReferencedBlockNumber"],
        "00F0" : ["IS", "ReferencedControlPointIndex"],
        "00F2" : ["SQ", "ReferencedControlPointSequence"],
        "00F4" : ["IS", "ReferencedStartControlPointIndex"],
        "00F6" : ["IS", "ReferencedStopControlPointIndex"],
        "0100" : ["IS", "ReferencedRangeShifterNumber"],
        "0102" : ["IS", "ReferencedLateralSpreadingDeviceNumber"],
        "0104" : ["IS", "ReferencedRangeModulatorNumber"]
    },
    "300E" : {
        "0002" : ["CS", "ApprovalStatus"],
        "0004" : ["DA", "ReviewDate"],
        "0005" : ["TM", "ReviewTime"],
        "0008" : ["PN", "ReviewerName"]
    },
    "4000" : {
        "0010" : ["LT", "Arbitrary"],
        "4000" : ["LT", "TextComments"]
    },
    "4008" : {
        "0040" : ["SH", "ResultsID"],
        "0042" : ["LO", "ResultsIDIssuer"],
        "0050" : ["SQ", "ReferencedInterpretationSequence"],
        "00FF" : ["CS", "ReportProductionStatusTrial"],
        "0100" : ["DA", "InterpretationRecordedDate"],
        "0101" : ["TM", "InterpretationRecordedTime"],
        "0102" : ["PN", "InterpretationRecorder"],
        "0103" : ["LO", "ReferenceToRecordedSound"],
        "0108" : ["DA", "InterpretationTranscriptionDate"],
        "0109" : ["TM", "InterpretationTranscriptionTime"],
        "010A" : ["PN", "InterpretationTranscriber"],
        "010B" : ["ST", "InterpretationText"],
        "010C" : ["PN", "InterpretationAuthor"],
        "0111" : ["SQ", "InterpretationApproverSequence"],
        "0112" : ["DA", "InterpretationApprovalDate"],
        "0113" : ["TM", "InterpretationApprovalTime"],
        "0114" : ["PN", "PhysicianApprovingInterpretation"],
        "0115" : ["LT", "InterpretationDiagnosisDescription"],
        "0117" : ["SQ", "InterpretationDiagnosisCodeSequence"],
        "0118" : ["SQ", "ResultsDistributionListSequence"],
        "0119" : ["PN", "DistributionName"],
        "011A" : ["LO", "DistributionAddress"],
        "0200" : ["SH", "InterpretationID"],
        "0202" : ["LO", "InterpretationIDIssuer"],
        "0210" : ["CS", "InterpretationTypeID"],
        "0212" : ["CS", "InterpretationStatusID"],
        "0300" : ["ST", "Impressions"],
        "4000" : ["ST", "ResultsComments"]
    },
    "4010" : {
        "0001" : ["CS", "LowEnergyDetectors"],
        "0002" : ["CS", "HighEnergyDetectors"],
        "0004" : ["SQ", "DetectorGeometrySequence"],
        "1001" : ["SQ", "ThreatROIVoxelSequence"],
        "1004" : ["FL", "ThreatROIBase"],
        "1005" : ["FL", "ThreatROIExtents"],
        "1006" : ["OB", "ThreatROIBitmap"],
        "1007" : ["SH", "RouteSegmentID"],
        "1008" : ["CS", "GantryType"],
        "1009" : ["CS", "OOIOwnerType"],
        "100A" : ["SQ", "RouteSegmentSequence"],
        "1010" : ["US", "PotentialThreatObjectID"],
        "1011" : ["SQ", "ThreatSequence"],
        "1012" : ["CS", "ThreatCategory"],
        "1013" : ["LT", "ThreatCategoryDescription"],
        "1014" : ["CS", "ATDAbilityAssessment"],
        "1015" : ["CS", "ATDAssessmentFlag"],
        "1016" : ["FL", "ATDAssessmentProbability"],
        "1017" : ["FL", "Mass"],
        "1018" : ["FL", "Density"],
        "1019" : ["FL", "ZEffective"],
        "101A" : ["SH", "BoardingPassID"],
        "101B" : ["FL", "CenterOfMass"],
        "101C" : ["FL", "CenterOfPTO"],
        "101D" : ["FL", "BoundingPolygon"],
        "101E" : ["SH", "RouteSegmentStartLocationID"],
        "101F" : ["SH", "RouteSegmentEndLocationID"],
        "1020" : ["CS", "RouteSegmentLocationIDType"],
        "1021" : ["CS", "AbortReason"],
        "1023" : ["FL", "VolumeOfPTO"],
        "1024" : ["CS", "AbortFlag"],
        "1025" : ["DT", "RouteSegmentStartTime"],
        "1026" : ["DT", "RouteSegmentEndTime"],
        "1027" : ["CS", "TDRType"],
        "1028" : ["CS", "InternationalRouteSegment"],
        "1029" : ["LO", "ThreatDetectionAlgorithmandVersion"],
        "102A" : ["SH", "AssignedLocation"],
        "102B" : ["DT", "AlarmDecisionTime"],
        "1031" : ["CS", "AlarmDecision"],
        "1033" : ["US", "NumberOfTotalObjects"],
        "1034" : ["US", "NumberOfAlarmObjects"],
        "1037" : ["SQ", "PTORepresentationSequence"],
        "1038" : ["SQ", "ATDAssessmentSequence"],
        "1039" : ["CS", "TIPType"],
        "103A" : ["CS", "DICOSVersion"],
        "1041" : ["DT", "OOIOwnerCreationTime"],
        "1042" : ["CS", "OOIType"],
        "1043" : ["FL", "OOISize"],
        "1044" : ["CS", "AcquisitionStatus"],
        "1045" : ["SQ", "BasisMaterialsCodeSequence"],
        "1046" : ["CS", "PhantomType"],
        "1047" : ["SQ", "OOIOwnerSequence"],
        "1048" : ["CS", "ScanType"],
        "1051" : ["LO", "ItineraryID"],
        "1052" : ["SH", "ItineraryIDType"],
        "1053" : ["LO", "ItineraryIDAssigningAuthority"],
        "1054" : ["SH", "RouteID"],
        "1055" : ["SH", "RouteIDAssigningAuthority"],
        "1056" : ["CS", "InboundArrivalType"],
        "1058" : ["SH", "CarrierID"],
        "1059" : ["CS", "CarrierIDAssigningAuthority"],
        "1060" : ["FL", "SourceOrientation"],
        "1061" : ["FL", "SourcePosition"],
        "1062" : ["FL", "BeltHeight"],
        "1064" : ["SQ", "AlgorithmRoutingCodeSequence"],
        "1067" : ["CS", "TransportClassification"],
        "1068" : ["LT", "OOITypeDescriptor"],
        "1069" : ["FL", "TotalProcessingTime"],
        "106C" : ["OB", "DetectorCalibrationData"]
    }
};



/*** Static Methods ***/

daikon.Dictionary.getVR = function (group, element) {
    var vr, elementData, groupData;

    groupData = daikon.Dictionary.dict[daikon.Utils.dec2hex(group)];
    if (groupData) {
        elementData = groupData[daikon.Utils.dec2hex(element)];
        if (elementData) {
            vr = elementData[0];
        }
    }

    if (!vr) {
        groupData = daikon.Dictionary.dictPrivate[daikon.Utils.dec2hex(group)];
        if (groupData) {
            elementData = groupData[daikon.Utils.dec2hex(element)];
            if (elementData) {
                vr = elementData[0];
            }
        }
    }

    if (!vr) {
        vr = 'OB';
    }

    return vr;
};



daikon.Dictionary.getDescription = function (group, element) {
    var des, elementData, groupData;

    groupData = daikon.Dictionary.dict[daikon.Utils.dec2hex(group)];
    if (groupData) {
        elementData = groupData[daikon.Utils.dec2hex(element)];
        if (elementData) {
            des = elementData[1];
        }
    }

    if (!des) {
        groupData = daikon.Dictionary.dictPrivate[daikon.Utils.dec2hex(group)];
        if (groupData) {
            elementData = groupData[daikon.Utils.dec2hex(element)];
            if (elementData) {
                des = elementData[1];
            }
        }
    }

    if (!des) {
        des = 'PrivateData';
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
