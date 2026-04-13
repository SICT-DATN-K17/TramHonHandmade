# -*- coding: utf-8 -*-
{
    'name': "tramhon_product",

    'summary': """
        Product module by Tramhon team""",

    'author': "Tran Manh Hung",
    'website': "https://www.google.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/16.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Management',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'product', 'stock', 'tramhon_core', 'sale'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/product_category_views.xml',
        'views/product_template_views.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
}
