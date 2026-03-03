import { Card, CardContent, Typography, TextField } from '@mui/material'

const fLabel = { fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }

export default function EscalationNotes({ value, onChange }) {
  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography sx={{ ...fLabel, mb: 1, color: 'text.secondary' }}>Escalation Notes</Typography>
        <TextField
          multiline minRows={3} maxRows={10} fullWidth size="small"
          placeholder="Add escalation notes, action items, or key decisions..."
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          InputProps={{ sx: { fontSize: 'clamp(0.72rem, 0.9vw, 0.82rem)' } }}
        />
      </CardContent>
    </Card>
  )
}
