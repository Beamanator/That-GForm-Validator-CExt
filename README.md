# That-GForm-Validator_CExt

Some important notes about this extension:
- If validation is set up on a field and the field name is changed, you MUST tell the developer to change the settings in Firebase

Current working / live Validation schemes:

| Validate Type | Format(s) |
|---------------|--------|
| Date          | future |
| Unhcr         | New (XXX-XXCXXXXX), Old (XXXX/XXXX), Appointment Slip (XXX-CSXXXXXXXX), None ('None'), custom (ex: 'Unknown' = '^UNKN0WN$,Unknown') |

# Validation Already Set Up On Specific Forms

*RSD First Instance Preparation Workshop - Sign-up sheet*

| Validation Type | Field Name | Format(s) |
|-----------------|-------------|-------|
| Date            | Date of RSD FI IV | future |

*UCY Psychosocial Intake form*

| Validation Type | Field Name | Format(s) |
|-----------------|------------|-----------|
| Unhcr           | UNHCR Number| New, Appointment Slip, None, Old |
