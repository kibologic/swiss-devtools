# GitHub Linguist heuristics for SwissJS vs .ui conflicts
# Add this to github-linguist/linguist/lib/linguist/heuristics.rb
# in the appropriate section.
#
# .ui extension conflict:
#   - SwissJS uses .ui for component files
#   - Qt Designer uses .ui for XML UI layouts
#   - Clarity (other tools) may also use .ui
#
# Resolution strategy:
#   1. Qt Designer files always start with <?xml and contain <ui version=
#   2. SwissJS files contain Swiss component syntax patterns

disambiguate "*.ui" do |data|
  # Qt Designer: XML-based UI files
  if data.include?("<?xml") && (data.include?('<ui version=') || data.include?('<ui '))
    Language["Qt Designer"]

  # SwissJS: component declarations or SwissJS-style imports
  elsif data.match?(/\bcomponent\s+[A-Z][A-Za-z0-9_]*\s*\{/) ||
        data.match?(/@requires\s*\(/) ||
        data.match?(/\bstate\s*\{/) ||
        data.match?(/from\s+['"]@swissjs\//) ||
        data.match?(/\breactive\s+let\b/) ||
        data.match?(/\bcomputed\s+get\b/)
    Language["SwissJS"]

  else
    nil
  end
end

disambiguate "*.uix" do |_data|
  # .uix is exclusively SwissJS — no known conflicts
  Language["SwissJS"]
end
