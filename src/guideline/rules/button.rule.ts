import type {
  GuidelineRule,
  GuidelineViolation,
  DesignGuideline,
} from '../../types/guideline'

export const buttonRule: GuidelineRule = {
  ruleId: 'button-design-compliance',
  check: (input, guideline) => {
    const violations: GuidelineViolation[] = []
    const { components, css } = input

    // 버튼 컴포넌트 식별
    const buttons = components.filter(
      (c) =>
        c.type === 'button' ||
        (c.tagName === 'button' && c.attributes.role !== 'menuitem'),
    )

    buttons.forEach((button) => {
      // 버튼별 스타일 추출
      const buttonCss = css.find((rule) =>
        rule.selector.includes(button.selector),
      )

      if (!buttonCss) return

      const props = buttonCss.properties
      const variants = (guideline as DesignGuideline).buttonVariants || {}

      // 배경색 체크
      const bgColor = props.backgroundColor || props['background-color']
      const allowedBgColors = Object.values(variants)
        .map((v) => v.backgroundColor)
        .filter(Boolean)

      if (bgColor && !allowedBgColors.includes(bgColor)) {
        violations.push({
          ruleId: 'button-invalid-background',
          severity: 'warning',
          message: `Button background color '${bgColor}' does not match design guideline`,
          targetSelector: button.selector,
          expected: `One of: ${allowedBgColors.join(', ')}`,
          actual: bgColor,
        })
      }

      // 보더 반지름 체크
      const borderRadius =
        props.borderRadius ||
        props['border-radius'] ||
        props['border-top-left-radius']
      const allowedRadii =
        (guideline as DesignGuideline).borderRadius || [3, 4]

      if (borderRadius) {
        const radiusNum = parseInt(borderRadius, 10)
        if (!allowedRadii.includes(radiusNum)) {
          violations.push({
            ruleId: 'button-invalid-border-radius',
            severity: 'info',
            message: `Button border-radius '${borderRadius}' should be ${allowedRadii.join(' or ')}px`,
            targetSelector: button.selector,
            expected: `One of: ${allowedRadii.map((r: number) => `${r}px`).join(', ')}`,
            actual: borderRadius,
          })
        }
      }

      // 텍스트 크기 체크 (해당하는 경우)
      const fontSize = props.fontSize || props['font-size']
      if (fontSize) {
        const typographies = (guideline as DesignGuideline).typography || []
        const buttonTypographies = typographies.filter((t) =>
          t.name?.includes('button'),
        )
        const allowedSizes = buttonTypographies.map((t) => t.fontSize)

        if (fontSize && !allowedSizes.includes(fontSize)) {
          violations.push({
            ruleId: 'button-invalid-font-size',
            severity: 'info',
            message: `Button font size '${fontSize}' should match guideline typography`,
            targetSelector: button.selector,
            expected: `One of: ${allowedSizes.join(', ')}`,
            actual: fontSize,
          })
        }
      }
    })

    return violations
  },
}
