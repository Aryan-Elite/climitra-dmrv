const PROMPT = `You are reading a field document from a biomass/biochar operation in Gujarat, India.
Extract the following fields from the image. For each field return a confidence score from 0 to 1.
Be conservative — only return high confidence (>0.85) when the value is clearly readable.

Fields to extract:
- weight: total weight in kg (number only, no units)
- moisture_percentage: moisture percentage (number only, no % sign)
- vehicle_number: vehicle registration number (Gujarat format like GJ05AB1234)
- date: date of the document (ISO format YYYY-MM-DD)
- document_type: one of "weighbridge_slip", "moisture_reading", "dispatch_challan", "other"
- driver_id: driver name or ID if visible

Return ONLY valid JSON in this exact format:
{
  "fields": [
    { "field_name": "weight", "value": "4823", "confidence": 0.95 },
    { "field_name": "moisture_percentage", "value": "12.4", "confidence": 0.80 },
    { "field_name": "vehicle_number", "value": "GJ05AB1234", "confidence": 0.90 },
    { "field_name": "date", "value": "2026-05-27", "confidence": 0.85 },
    { "field_name": "document_type", "value": "weighbridge_slip", "confidence": 0.95 },
    { "field_name": "driver_id", "value": "Ram Singh", "confidence": 0.70 }
  ]
}

If a field is not visible or not present, set value to null and confidence to 0.`

module.exports = PROMPT
