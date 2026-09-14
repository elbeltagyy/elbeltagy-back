const SocialConstants = {
    FACEBOOK: 'facebook',
    MESSENGER: "messenger",
    config: { //*_*
        messenger: {
            APP_ID: '27206879988974585', //1713731439756238
            APP_SECRET: '438a6a61e91070dc82004a1cdaeddbd5',//474ad7a5fe735cb5957616b62b696f12
            scope: 'pages_messaging,pages_manage_metadata,pages_read_engagement'
        },
        facebook: {
            APP_ID: '27206879988974585', //1538043071228285
            APP_SECRET: '438a6a61e91070dc82004a1cdaeddbd5',//0d868412fdcc03fe4f388bcc6a249940
            scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,business_management,pages_read_user_content,pages_manage_engagement'
        },
    }
}
//27206879988974585 - 438a6a61e91070dc82004a1cdaeddbd5
//On New Customer => add callback login
module.exports = SocialConstants