import type { CallToAction, ClassMap, Image } from "./component";

export interface Widget {
  id?: string;
  isDark?: boolean;
  bg?: string;
  /**
   * Widget 级 classes：顶层键是类名字符串，只有 `headline` 是整张子映射
   * （Section/Features2/Content 直接把它当 Headline 的 classes 用）。
   * 把被消费的键显式写出、其余键仍放行字符串或子映射，调用点就不必各自断言收窄。
   * 注意不能用 `Record<string, string> & { headline?: ClassMap }`：命名属性与 string 索引签名冲突，TS 直接报错。
   */
  classes?: {
    container?: string;
    headline?: ClassMap;
    [key: string]: string | ClassMap | undefined;
  };
}

export interface Headline {
  title?: string;
  subtitle?: string;
  tagline?: string;
  classes?: ClassMap;
}

// 导出：它们是导出类型 Team.team 的元素类型，不导出的话消费方无法命名/构造该形状
export interface TeamMember {
  name?: string;
  job?: string;
  image?: Image;
  socials?: Array<Social>;
  description?: string;
  classes?: ClassMap;
}

export interface Social {
  icon?: string;
  href?: string;
}

export interface Stat {
  amount?: number | string;
  title?: string;
  icon?: string;
}

export interface Item {
  title?: string;
  description?: string;
  icon?: string;
  classes?: ClassMap;
  callToAction?: CallToAction;
  image?: Image;
}

export interface Price {
  title?: string;
  subtitle?: string;
  description?: string;
  price?: number | string;
  period?: string;
  items?: Array<Item>;
  callToAction?: CallToAction;
  hasRibbon?: boolean;
  ribbonTitle?: string;
}

export interface Testimonial {
  title?: string;
  testimonial?: string;
  name?: string;
  job?: string;
  image?: string | Image;
}

// 页面部件
export interface Hero
  extends Omit<Headline, "classes">, Omit<Widget, "isDark" | "classes"> {
  content?: string;
  actions?: string | CallToAction[];
  image?: string | Image;
  nextSectionId?: string;
}

export interface Team extends Omit<Headline, "classes">, Widget {
  team?: Array<TeamMember>;
}

export interface Stats extends Omit<Headline, "classes">, Widget {
  stats?: Array<Stat>;
}

export interface Pricing extends Omit<Headline, "classes">, Widget {
  prices?: Array<Price>;
}

export interface Testimonials extends Omit<Headline, "classes">, Widget {
  testimonials?: Array<Testimonial>;
  callToAction?: CallToAction;
}

export interface Brands extends Omit<Headline, "classes">, Widget {
  icons?: Array<string>;
  images?: Array<Image>;
}

export interface Features extends Omit<Headline, "classes">, Widget {
  image?: string | Image;
  items?: Array<Item>;
  columns?: number;
  defaultIcon?: string;
  isBeforeContent?: boolean;
  isAfterContent?: boolean;
  variant?: "card" | "inline";
}

export interface Faqs extends Omit<Headline, "classes">, Widget {
  items?: Array<Item>;
  columns?: number;
}

export interface Content extends Omit<Headline, "classes">, Widget {
  content?: string;
  image?: string | Image;
  items?: Array<Item>;
  columns?: number;
  isReversed?: boolean;
  isAfterContent?: boolean;
  callToAction?: CallToAction;
}

export interface TimelineData {
  year: string;
  title: string;
  description: string;
  iconName?: string;
  iconColor?: string;
}

export interface Contact extends Omit<Headline, "classes">, Widget {
  inputs?: Array<{
    type: string;
    name: string;
    label?: string;
    autocomplete?: string;
    placeholder?: string;
  }>;
  textarea?: {
    label?: string;
    name?: string;
    placeholder?: string;
    rows?: number;
  };
  disclaimer?: {
    label?: string;
  };
  button?: string;
  description?: string;
}
