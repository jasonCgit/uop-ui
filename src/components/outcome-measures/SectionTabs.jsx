import { Tabs, Tab, Box } from '@mui/material'

export default function SectionTabs({ sections, activeSection, onChange }) {
  if (!sections?.length) return null
  const idx = sections.findIndex(s => s.id === activeSection)
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={idx >= 0 ? idx : 0}
        onChange={(_, newIdx) => onChange(sections[newIdx].id)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 36,
          '& .MuiTab-root': {
            minHeight: 36,
            py: 0.5,
            fontSize: 'clamp(0.7rem, 0.9vw, 0.82rem)',
            textTransform: 'none',
            fontWeight: 600,
          },
        }}
      >
        {sections.map(s => (
          <Tab key={s.id} label={s.short} />
        ))}
      </Tabs>
    </Box>
  )
}
